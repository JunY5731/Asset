/**
 * Detector 서비스 타입 정의
 */

export interface DetectionBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Detection {
  label: string;
  confidence: number;
  box: DetectionBox;
}

export interface DetectorRequest {
  image: string; // base64 인코딩된 이미지
  threshold?: number;
  nms_threshold?: number;
}

export interface DetectorResponse {
  detections: Detection[];
}
