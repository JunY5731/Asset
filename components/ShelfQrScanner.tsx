'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ITEM_MAP, QR_SCAN_DURATION, QR_SCAN_INTERVAL, QR_MIN_DETECTION_COUNT } from '@/lib/constants';

// jsQR 타입 선언
declare function jsQR(data: Uint8ClampedArray, width: number, height: number): {
  data: string;
} | null;

interface ShelfQrScannerProps {
  shelfCameraId: string;
  faceCameraId: string;
  onItemsDetected: (items: string[]) => void;
}

async function scanQRFromVideo(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  scanDuration: number = QR_SCAN_DURATION,
  interval: number = QR_SCAN_INTERVAL
): Promise<string[]> {
  const detectedQRs = new Set<string>();
  const startTime = Date.now();

  return new Promise((resolve) => {
    const scanInterval = setInterval(() => {
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          clearInterval(scanInterval);
          resolve([]);
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          const qrId = code.data.trim();
          // ITEM_XX 형식만 인정
          if (qrId.startsWith('ITEM_') && ITEM_MAP[qrId]) {
            detectedQRs.add(qrId);
          }
        }
      } catch (error) {
        console.error('QR scan error:', error);
      }

      if (Date.now() - startTime >= scanDuration) {
        clearInterval(scanInterval);
        resolve(Array.from(detectedQRs));
      }
    }, interval);
  });
}

export function ShelfQrScanner({ shelfCameraId, faceCameraId, onItemsDetected }: ShelfQrScannerProps) {
  const [beforeIds, setBeforeIds] = useState<string[]>([]);
  const [afterIds, setAfterIds] = useState<string[]>([]);
  const [takenIds, setTakenIds] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState<string>('대기 중');

  const qrVideoRef = useRef<HTMLVideoElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const qrStreamRef = useRef<MediaStream | null>(null);

  // 선반 카메라 스트림
  useEffect(() => {
    const stopStream = () => {
      if (qrStreamRef.current) {
        qrStreamRef.current.getTracks().forEach(track => track.stop());
        qrStreamRef.current = null;
      }
    };

    if (shelfCameraId && qrVideoRef.current) {
      // 얼굴 카메라와 동일한 장치면 스트림 차단
      if (faceCameraId && shelfCameraId === faceCameraId) {
        stopStream();
        setStatus('얼굴 카메라와 선반 카메라에 서로 다른 장치를 선택하세요.');
        return;
      }

      navigator.mediaDevices
        .getUserMedia({
          video: {
            deviceId: { exact: shelfCameraId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
        .then(stream => {
          stopStream();
          qrStreamRef.current = stream;
          if (qrVideoRef.current) {
            qrVideoRef.current.srcObject = stream;
            setStatus('카메라 연결됨 - QR 스캔 준비');
          }
        })
        .catch(err => {
          console.error('Shelf camera error:', err);
          setStatus('카메라 접근 실패: ' + err.message);
        });
    } else {
      stopStream();
      setStatus('카메라 대기 중...');
    }

    return () => {
      stopStream();
    };
  }, [shelfCameraId, faceCameraId]);

  const handleBeforeScan = async () => {
    if (!qrVideoRef.current || !qrCanvasRef.current) {
      setStatus('카메라가 준비되지 않았습니다.');
      return;
    }

    setIsScanning(true);
    setStatus('QR 스캔 중... (2초)');

    try {
      const detected = await scanQRFromVideo(qrVideoRef.current, qrCanvasRef.current);

      if (detected.length < QR_MIN_DETECTION_COUNT) {
        setStatus(`경고: QR이 너무 적게 감지되었습니다 (${detected.length}개). 카메라 각도/초점/조명 확인 후 재시도해주세요.`);
        setIsScanning(false);
        return;
      }

      setBeforeIds(detected);
      setStatus(`기준 상태 저장 완료: ${detected.length}개 QR 감지 (${detected.map(id => ITEM_MAP[id]).join(', ')})`);
    } catch (error) {
      console.error('Before scan error:', error);
      setStatus('스캔 오류: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    } finally {
      setIsScanning(false);
    }
  };

  const handleAfterCompare = async () => {
    if (beforeIds.length === 0) {
      setStatus('먼저 기준 상태를 저장해주세요.');
      return;
    }

    if (!qrVideoRef.current || !qrCanvasRef.current) {
      setStatus('카메라가 준비되지 않았습니다.');
      return;
    }

    setIsScanning(true);
    setStatus('1.5초 후 After 스캔 시작...');

    // 1.5초 대기
    await new Promise(resolve => setTimeout(resolve, 1500));

    setStatus('After QR 스캔 중... (2초)');

    try {
      const detected = await scanQRFromVideo(qrVideoRef.current, qrCanvasRef.current);

      if (detected.length < QR_MIN_DETECTION_COUNT) {
        setStatus(`경고: After QR이 너무 적게 감지되었습니다 (${detected.length}개). 카메라 각도/초점/조명 확인 후 재시도해주세요.`);
        setIsScanning(false);
        return;
      }

      setAfterIds(detected);

      // before에는 있고 after에 없는 QR = 사라진 품목
      const taken = beforeIds.filter(id => !detected.includes(id));

      // 오탐 방지: after가 before보다 갑자기 많아진 경우
      if (detected.length > beforeIds.length + 1) {
        setStatus(`경고: After QR이 Before보다 많습니다 (Before: ${beforeIds.length}, After: ${detected.length}). 재시도해주세요.`);
        setIsScanning(false);
        return;
      }

      if (taken.length === 0) {
        setStatus('사라진 품목이 없습니다.');
        setTakenIds([]);
        setSelectedItems([]);
        setIsScanning(false);
        return;
      }

      setTakenIds(taken);
      const takenNames = taken.map(id => ITEM_MAP[id]);
      setSelectedItems(takenNames);
      onItemsDetected(takenNames);
      setStatus(`감지 완료: ${takenNames.length}개 품목 (${takenNames.join(', ')})`);
    } catch (error) {
      console.error('After scan error:', error);
      setStatus('스캔 오류: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    } finally {
      setIsScanning(false);
    }
  };

  const toggleItem = (item: string) => {
    setSelectedItems(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const canScan = shelfCameraId && faceCameraId !== shelfCameraId;

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">선반 카메라로 품목 자동 기록(QR)</Label>

      {!canScan && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          얼굴 카메라와 선반 카메라에 서로 다른 장치를 선택하세요.
        </div>
      )}

      <div className="relative">
        <video
          ref={qrVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-48 bg-black rounded"
        />
        <canvas ref={qrCanvasRef} className="hidden" />
      </div>

      <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded">{status}</div>

      <div className="flex gap-2">
        <Button
          onClick={handleBeforeScan}
          disabled={isScanning || !canScan}
          className="flex-1"
        >
          {isScanning ? '스캔 중...' : '기준 상태 저장(BEFORE)'}
        </Button>
        <Button
          onClick={handleAfterCompare}
          disabled={isScanning || beforeIds.length === 0 || !canScan}
          variant="default"
          className="flex-1"
        >
          {isScanning ? '스캔 중...' : '대여 확정(After 비교)'}
        </Button>
      </div>

      {beforeIds.length > 0 && (
        <div className="text-sm text-gray-600">
          기준 상태: {beforeIds.map(id => ITEM_MAP[id]).join(', ')}
        </div>
      )}

      {takenIds.length > 0 && (
        <div className="border rounded p-3 bg-yellow-50">
          <Label className="block font-medium mb-2">감지된 반출 품목 (확인 및 선택)</Label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {takenIds.map(id => {
              const name = ITEM_MAP[id];
              return (
                <label key={id} className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={selectedItems.includes(name)}
                    onCheckedChange={() => toggleItem(name)}
                  />
                  <span className="text-sm">{name}</span>
                </label>
              );
            })}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            선택된 품목: {selectedItems.length}개
          </div>
        </div>
      )}
    </div>
  );
}
