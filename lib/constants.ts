// 품목 QR 매핑
export const ITEM_MAP: Record<string, string> = {
  ITEM_01: '각티슈',
  ITEM_02: '물티슈',
  ITEM_03: '볼펜',
  ITEM_04: '풀',
  ITEM_05: '네임펜',
};

// 얼굴 인식 설정
export const FACE_MODEL_URL = '/models';
export const FACE_TEMPLATE_KEY = 'inbody_face_templates_v1';
export const FACE_THRESHOLD = 0.55; // 기본 threshold
export const FACE_RECOGNITION_INTERVAL = 600; // ms
export const FACE_MATCH_COUNT_THRESHOLD = 2; // 연속 매칭 횟수

// 카메라 설정
export const CAMERA_FACE_KEY = 'inbody_face_cam_id';
export const CAMERA_SHELF_KEY = 'inbody_shelf_cam_id';

// QR 스캔 설정
export const QR_SCAN_DURATION = 2000; // ms
export const QR_SCAN_INTERVAL = 200; // ms
export const QR_MIN_DETECTION_COUNT = 2; // 최소 감지 개수
