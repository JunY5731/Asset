'use client';

import { useEffect, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FACE_MODEL_URL, FACE_TEMPLATE_KEY, FACE_THRESHOLD, FACE_RECOGNITION_INTERVAL, FACE_MATCH_COUNT_THRESHOLD } from '@/lib/constants';

// face-api.js 타입 선언
declare global {
  interface Window {
    faceapi: typeof import('face-api.js');
  }
}

interface Employee {
  id: string;
  name: string;
  team: string;
  title: string;
}

interface FaceTemplate {
  employeeId: string;
  name: string;
  team: string;
  title: string;
  descriptors: number[][];
}

interface FaceAutoFillProps {
  employees: Employee[];
  faceCameraId: string;
  onRecognized: (employee: { id: string; name: string; team: string; confidence: number }) => void;
  onManualOverride?: () => void;
}

let faceModelsLoaded = false;
let faceModelsLoadingPromise: Promise<void> | null = null;

async function ensureFaceModelsLoaded(): Promise<void> {
  if (faceModelsLoaded) return;
  if (!faceModelsLoadingPromise) {
    faceModelsLoadingPromise = (async () => {
      if (typeof window === 'undefined' || !window.faceapi) {
        throw new Error('face-api.js is not loaded');
      }
      await window.faceapi.nets.ssdMobilenetv1.loadFromUri(FACE_MODEL_URL);
      await window.faceapi.nets.faceLandmark68Net.loadFromUri(FACE_MODEL_URL);
      await window.faceapi.nets.faceRecognitionNet.loadFromUri(FACE_MODEL_URL);
      faceModelsLoaded = true;
    })();
  }
  await faceModelsLoadingPromise;
}

function loadFaceTemplatesFromStorage(): FaceTemplate[] {
  try {
    const raw = localStorage.getItem(FACE_TEMPLATE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // { employeeId: { name, team, title, descriptors: number[][] } }
    return Object.entries(parsed).map(([employeeId, data]: [string, any]) => ({
      employeeId,
      name: data.name,
      team: data.team,
      title: data.title,
      descriptors: data.descriptors || [],
    }));
  } catch {
    return [];
  }
}

function saveFaceTemplatesToStorage(templates: FaceTemplate[]): void {
  const obj: Record<string, any> = {};
  templates.forEach(t => {
    obj[t.employeeId] = {
      name: t.name,
      team: t.team,
      title: t.title,
      descriptors: t.descriptors,
    };
  });
  localStorage.setItem(FACE_TEMPLATE_KEY, JSON.stringify(obj));
}

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function FaceAutoFill({ employees, faceCameraId, onRecognized, onManualOverride }: FaceAutoFillProps) {
  const [faceTemplates, setFaceTemplates] = useState<FaceTemplate[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [enrollStatus, setEnrollStatus] = useState<string>('');
  const [faceAutoFillEnabled, setFaceAutoFillEnabled] = useState(false);
  const [faceStatus, setFaceStatus] = useState<string>('대기 중');
  const [manualOverrideUntil, setManualOverrideUntil] = useState<number>(0);
  const [matchCount, setMatchCount] = useState<{ id: string; count: number } | null>(null);

  const faceVideoRef = useRef<HTMLVideoElement>(null);
  const faceStreamRef = useRef<MediaStream | null>(null);
  const recognitionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 템플릿 로딩
  useEffect(() => {
    const templates = loadFaceTemplatesFromStorage();
    setFaceTemplates(templates);
  }, []);

  // 얼굴 카메라 스트림
  useEffect(() => {
    const stopStream = () => {
      if (faceStreamRef.current) {
        faceStreamRef.current.getTracks().forEach(track => track.stop());
        faceStreamRef.current = null;
      }
    };

    if (faceCameraId && faceVideoRef.current) {
      navigator.mediaDevices
        .getUserMedia({
          video: { deviceId: { exact: faceCameraId } },
          audio: false,
        })
        .then(stream => {
          stopStream();
          faceStreamRef.current = stream;
          if (faceVideoRef.current) {
            faceVideoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error('Face camera error:', err);
          setFaceStatus('카메라 접근 실패: ' + err.message);
        });
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [faceCameraId]);

  // 얼굴 인식 루프
  useEffect(() => {
    const clearLoop = () => {
      if (recognitionIntervalRef.current) {
        clearInterval(recognitionIntervalRef.current);
        recognitionIntervalRef.current = null;
      }
    };

    if (faceAutoFillEnabled && faceVideoRef.current) {
      clearLoop();
      recognitionIntervalRef.current = setInterval(async () => {
        try {
          const templates = loadFaceTemplatesFromStorage();
          if (templates.length === 0) {
            setFaceStatus('등록된 얼굴 템플릿이 없습니다.');
            return;
          }

          if (!faceVideoRef.current || faceVideoRef.current.readyState < 2) {
            return;
          }

          await ensureFaceModelsLoaded();

          const result = await window.faceapi
            .detectSingleFace(faceVideoRef.current, new window.faceapi.SsdMobilenetv1Options())
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (!result) {
            setFaceStatus('얼굴이 감지되지 않았습니다.');
            setMatchCount(null);
            return;
          }

          const descriptor = Array.from(result.descriptor);

          // 모든 템플릿과 비교 (TS narrowing 안정성을 위해 명시적 루프 사용)
          let bestTemplate: FaceTemplate | null = null;
          let bestDistance = Number.POSITIVE_INFINITY;

          for (const template of templates) {
            for (const d of template.descriptors) {
              const dist = euclideanDistance(descriptor, d);
              if (dist < bestDistance) {
                bestDistance = dist;
                bestTemplate = template;
              }
            }
          }

          if (!bestTemplate || bestDistance > FACE_THRESHOLD) {
            setFaceStatus('등록된 사용자와 매칭되지 않습니다.');
            setMatchCount(null);
            return;
          }

          const now = Date.now();
          if (now < manualOverrideUntil) {
            setFaceStatus(`수동 입력 우선 (${bestTemplate.name} 후보, 거리 ${bestDistance.toFixed(2)})`);
            return;
          }

          // 연속 매칭 카운트
          if (matchCount && matchCount.id === bestTemplate.employeeId) {
            const newCount = matchCount.count + 1;
            setMatchCount({ id: bestTemplate.employeeId, count: newCount });

            if (newCount >= FACE_MATCH_COUNT_THRESHOLD) {
              // 확정
              const confidence = 1 - bestDistance;
              onRecognized({
                id: bestTemplate.employeeId,
                name: bestTemplate.name,
                team: bestTemplate.team,
                confidence,
              });
              setFaceStatus(`인식 성공: ${bestTemplate.team} ${bestTemplate.name} (거리 ${bestDistance.toFixed(2)})`);
            } else {
              setFaceStatus(`매칭 중... (${newCount}/${FACE_MATCH_COUNT_THRESHOLD})`);
            }
          } else {
            setMatchCount({ id: bestTemplate.employeeId, count: 1 });
            setFaceStatus(`매칭 중... (1/${FACE_MATCH_COUNT_THRESHOLD})`);
          }
        } catch (err) {
          console.error('Face recognition error:', err);
          setFaceStatus('얼굴 인식 중 오류가 발생했습니다.');
        }
      }, FACE_RECOGNITION_INTERVAL);
    } else {
      clearLoop();
      setMatchCount(null);
    }

    return () => {
      clearLoop();
    };
  }, [faceAutoFillEnabled, manualOverrideUntil, matchCount, onRecognized]);

  const handleEnrollCurrentFace = async () => {
    if (!selectedEmployeeId) {
      setEnrollStatus('직원을 선택해주세요.');
      return;
    }

    try {
      if (!faceVideoRef.current) {
        setEnrollStatus('카메라가 준비되지 않았습니다.');
        return;
      }

      setEnrollStatus('모델 로딩 및 얼굴 캡처 중...');
      await ensureFaceModelsLoaded();

      const result = await window.faceapi
        .detectSingleFace(faceVideoRef.current, new window.faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!result) {
        setEnrollStatus('얼굴이 감지되지 않았습니다. 화면 중앙에 얼굴을 위치시켜 주세요.');
        return;
      }

      const descriptor = Array.from(result.descriptor);
      const employee = employees.find(e => e.id === selectedEmployeeId);
      if (!employee) {
        setEnrollStatus('직원 정보를 찾을 수 없습니다.');
        return;
      }

      const templates = loadFaceTemplatesFromStorage();
      let template = templates.find(t => t.employeeId === selectedEmployeeId);
      if (!template) {
        template = {
          employeeId: selectedEmployeeId,
          name: employee.name,
          team: employee.team,
          title: employee.title,
          descriptors: [],
        };
        templates.push(template);
      }

      template.descriptors.push(descriptor);
      saveFaceTemplatesToStorage(templates);
      setFaceTemplates(templates);

      setEnrollStatus(`등록 성공: ${employee.name} (총 ${template.descriptors.length}개 샘플)`);
    } catch (err) {
      console.error('Enroll error:', err);
      setEnrollStatus('등록 중 오류가 발생했습니다.');
    }
  };

  const handleManualInput = () => {
    setManualOverrideUntil(Date.now() + 5000); // 5초간 수동입력 우선
    onManualOverride?.();
  };

  return (
    <div className="space-y-4">
      <div className="border rounded p-4 bg-gray-50">
        <Label className="text-sm font-medium mb-3 block">얼굴 등록</Label>
        <div className="space-y-3">
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger>
              <SelectValue placeholder="직원 선택" />
            </SelectTrigger>
            <SelectContent>
              {employees.map(emp => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.team} {emp.name} {emp.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleEnrollCurrentFace} disabled={!selectedEmployeeId}>
            현재 얼굴 등록
          </Button>
          <p className="text-xs text-gray-500">
            한 사람당 2~3회 다양한 각도로 등록하면 인식률이 좋아집니다.
          </p>
          {enrollStatus && <p className="text-xs text-gray-700">{enrollStatus}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="face-auto-fill"
            checked={faceAutoFillEnabled}
            onCheckedChange={(checked) => setFaceAutoFillEnabled(checked as boolean)}
          />
          <Label htmlFor="face-auto-fill" className="cursor-pointer">
            얼굴로 자동 입력
          </Label>
        </div>
        <span className="text-xs text-gray-500">{faceStatus}</span>
      </div>

      <div className="relative">
        <video
          ref={faceVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-48 bg-black rounded"
        />
      </div>
    </div>
  );
}
