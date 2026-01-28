'use client';

import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CAMERA_FACE_KEY, CAMERA_SHELF_KEY } from '@/lib/constants';

interface CameraDeviceSelectProps {
  faceCameraId: string;
  shelfCameraId: string;
  onFaceCameraChange: (deviceId: string) => void;
  onShelfCameraChange: (deviceId: string) => void;
}

export function CameraDeviceSelect({
  faceCameraId,
  shelfCameraId,
  onFaceCameraChange,
  onShelfCameraChange,
}: CameraDeviceSelectProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceWarning, setDeviceWarning] = useState<string>('');

  useEffect(() => {
    const initDevices = async () => {
      try {
        // 권한 요청 (라벨을 얻기 위해 필요)
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        tempStream.getTracks().forEach(track => track.stop());

        // 장치 목록 조회 (권한 후 라벨 포함)
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = allDevices.filter(device => device.kind === 'videoinput');
        setDevices(videoInputs);

        // localStorage에서 복원
        const savedFaceId = localStorage.getItem(CAMERA_FACE_KEY) || '';
        const savedShelfId = localStorage.getItem(CAMERA_SHELF_KEY) || '';

        const hasSavedFace = videoInputs.some(d => d.deviceId === savedFaceId);
        const hasSavedShelf = videoInputs.some(d => d.deviceId === savedShelfId);

        // Fallback: 저장된 ID가 없거나 현재 목록에 없으면 기본값
        if (!hasSavedFace || !savedFaceId) {
          if (videoInputs[0]) {
            onFaceCameraChange(videoInputs[0].deviceId);
          }
        } else {
          onFaceCameraChange(savedFaceId);
        }

        if (!hasSavedShelf || !savedShelfId) {
          if (videoInputs[1]) {
            onShelfCameraChange(videoInputs[1].deviceId);
          } else if (videoInputs[0] && videoInputs[0].deviceId !== savedFaceId) {
            onShelfCameraChange(videoInputs[0].deviceId);
          }
        } else {
          onShelfCameraChange(savedShelfId);
        }

        // 장치 변경 안내
        if ((savedFaceId && !hasSavedFace) || (savedShelfId && !hasSavedShelf)) {
          setDeviceWarning('장치가 변경되어 기본값으로 재설정되었습니다.');
          setTimeout(() => setDeviceWarning(''), 5000);
        }
      } catch (err) {
        console.error('Device initialization error:', err);
        setDeviceWarning('카메라 장치를 불러올 수 없습니다.');
      }
    };

    void initDevices();
  }, [onFaceCameraChange, onShelfCameraChange]);

  // 같은 deviceId 선택 시 경고
  useEffect(() => {
    if (faceCameraId && shelfCameraId && faceCameraId === shelfCameraId) {
      setDeviceWarning('얼굴 카메라와 선반 카메라에 서로 다른 장치를 선택하세요.');
    } else if (deviceWarning && !deviceWarning.includes('재설정')) {
      setDeviceWarning('');
    }
  }, [faceCameraId, shelfCameraId]);

  const getDeviceLabel = (device: MediaDeviceInfo, index: number): string => {
    const baseLabel = device.label && device.label.length > 0
      ? device.label
      : `Camera ${index + 1}`;
    const idSuffix = device.deviceId ? device.deviceId.slice(0, 6) : '';
    return idSuffix ? `${baseLabel} (${idSuffix}...)` : baseLabel;
  };

  const handleFaceChange = (deviceId: string) => {
    localStorage.setItem(CAMERA_FACE_KEY, deviceId);
    onFaceCameraChange(deviceId);
  };

  const handleShelfChange = (deviceId: string) => {
    localStorage.setItem(CAMERA_SHELF_KEY, deviceId);
    onShelfCameraChange(deviceId);
  };

  return (
    <div className="space-y-4">
      {deviceWarning && (
        <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
          {deviceWarning}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="face-camera">얼굴 카메라</Label>
          <Select value={faceCameraId} onValueChange={handleFaceChange}>
            <SelectTrigger id="face-camera">
              <SelectValue placeholder="카메라 선택" />
            </SelectTrigger>
            <SelectContent>
              {devices.map((device, index) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {getDeviceLabel(device, index)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="shelf-camera">선반 카메라</Label>
          <Select value={shelfCameraId} onValueChange={handleShelfChange}>
            <SelectTrigger id="shelf-camera">
              <SelectValue placeholder="카메라 선택" />
            </SelectTrigger>
            <SelectContent>
              {devices.map((device, index) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {getDeviceLabel(device, index)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {devices.length < 2 && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          웹캠 2대가 필요합니다(얼굴/선반 분리).
        </div>
      )}
    </div>
  );
}
