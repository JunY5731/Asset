'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { loadFaceModels, recognizeFace } from '@/lib/face-recognition';
import { toast } from 'sonner';

interface LoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: {
    borrowerName: string;
    borrowerTeam: string;
    itemsTaken: string[];
  }) => Promise<void>;
}

interface Detection {
  label: string;
  confidence: number;
}

export function LoanModal({ open, onOpenChange, onConfirm }: LoanModalProps) {
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerTeam, setBorrowerTeam] = useState('');
  const [itemsTaken, setItemsTaken] = useState<string[]>([]);
  const [availableItems, setAvailableItems] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [faceRecognitionEnabled] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // 얼굴 인식 모델 로드
  useEffect(() => {
    if (open && faceRecognitionEnabled) {
      loadFaceModels().catch((error) => {
        console.error('Face models loading failed:', error);
        toast.error('얼굴 인식 모델 로드를 실패했습니다.');
      });
    }
  }, [open, faceRecognitionEnabled]);

  // 비디오 스트림 시작 (웹캠 사용 시)
  useEffect(() => {
    if (open && faceRecognitionEnabled) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'user' } })
        .then((mediaStream) => {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        })
        .catch((error) => {
          console.error('Camera access failed:', error);
          toast.error('카메라 접근에 실패했습니다.');
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [open, faceRecognitionEnabled]);

  // 얼굴 인식 실행 (비디오에서)
  const handleFaceRecognition = async () => {
    if (!videoRef.current || !faceRecognitionEnabled) return;

    try {
      // TODO: 알려진 얼굴 데이터베이스에서 가져오기
      // 실제로는 API에서 가져와야 함
      const knownFaces: Array<{
        name: string;
        team: string;
        descriptor: Float32Array;
      }> = [];

      const result = await recognizeFace(videoRef.current, knownFaces);

      if (result) {
        setBorrowerName(result.name);
        setBorrowerTeam(result.team);
        toast.success(`${result.name}님을 인식했습니다.`);
      } else {
        toast.info('인식된 얼굴이 없습니다.');
      }
    } catch (error) {
      console.error('Face recognition error:', error);
      toast.error('얼굴 인식 중 오류가 발생했습니다.');
    }
  };

  // 대여 확정 처리
  const handleCommit = async () => {
    if (!borrowerName || !borrowerTeam) {
      toast.error('대여자 정보를 입력해주세요.');
      return;
    }

    setIsProcessing(true);
    setIsCapturing(true);

    try {
      // before/after 캡처 및 품목 탐지
      const response = await fetch('/api/loan/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          borrowerName,
          borrowerTeam,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '대여 확정 처리 실패');
      }

      const data = await response.json();
      const detectedItems = data.itemsTaken || [];

      setAvailableItems(detectedItems);
      setItemsTaken(detectedItems);
      setIsCapturing(false);

      toast.success('품목 탐지가 완료되었습니다. 확인해주세요.');
    } catch (error) {
      console.error('Commit error:', error);
      toast.error(
        error instanceof Error ? error.message : '대여 확정 처리 중 오류가 발생했습니다.'
      );
      setIsCapturing(false);
      setIsProcessing(false);
    }
  };

  // 최종 확인
  const handleFinalConfirm = async () => {
    if (itemsTaken.length === 0) {
      toast.error('대여할 품목을 선택해주세요.');
      return;
    }

    setIsProcessing(true);

    try {
      await onConfirm({
        borrowerName,
        borrowerTeam,
        itemsTaken,
      });

      toast.success('대여가 완료되었습니다.');
      onOpenChange(false);
      
      // 초기화
      setBorrowerName('');
      setBorrowerTeam('');
      setItemsTaken([]);
      setAvailableItems([]);
    } catch (error) {
      console.error('Final confirm error:', error);
      toast.error('대여 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleItem = (item: string) => {
    setItemsTaken((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>자산 대여</DialogTitle>
          <DialogDescription>
            대여자 정보를 입력하고 대여할 품목을 확인해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 얼굴 인식 영역 */}
          {faceRecognitionEnabled && (
            <div className="space-y-2">
              <Label>얼굴 인식 (자동 입력)</Label>
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-48 bg-black rounded-md"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFaceRecognition}
                  className="absolute bottom-2 right-2"
                >
                  인식
                </Button>
              </div>
            </div>
          )}

          {/* 대여자 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="borrowerName">이름 *</Label>
              <Input
                id="borrowerName"
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                placeholder="대여자 이름"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="borrowerTeam">팀 *</Label>
              <Input
                id="borrowerTeam"
                value={borrowerTeam}
                onChange={(e) => setBorrowerTeam(e.target.value)}
                placeholder="소속 팀"
              />
            </div>
          </div>

          {/* 대여 확정 버튼 */}
          <div className="flex justify-end">
            <Button
              onClick={handleCommit}
              disabled={isProcessing || !borrowerName || !borrowerTeam}
            >
              {isCapturing ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  캡처 중...
                </>
              ) : (
                '대여 확정'
              )}
            </Button>
          </div>

          {/* 탐지된 품목 확인 */}
          {availableItems.length > 0 && (
            <div className="space-y-2">
              <Label>탐지된 품목 (확인 및 수정)</Label>
              <div className="border rounded-md p-4 space-y-2 max-h-60 overflow-y-auto">
                {availableItems.map((item) => (
                  <div key={item} className="flex items-center space-x-2">
                    <Checkbox
                      id={item}
                      checked={itemsTaken.includes(item)}
                      onCheckedChange={() => toggleItem(item)}
                    />
                    <Label
                      htmlFor={item}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {item}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                선택된 품목: {itemsTaken.length}개
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            취소
          </Button>
          <Button
            onClick={handleFinalConfirm}
            disabled={isProcessing || itemsTaken.length === 0}
          >
            {isProcessing ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                처리 중...
              </>
            ) : (
              '확인'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
