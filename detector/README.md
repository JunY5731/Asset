# Asset Detector Service

품목 탐지 마이크로서비스 (FastAPI + YOLOv8/ONNX)

## 설치 및 실행

### 1. 가상환경 생성 및 활성화

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. 의존성 설치

```bash
pip install -r requirements.txt
```

### 3. 환경 변수 설정 (선택)

`.env` 파일 생성:

```env
CONFIDENCE_THRESHOLD=0.5
NMS_THRESHOLD=0.4
```

### 4. 서비스 실행

```bash
python main.py
```

또는 uvicorn 직접 실행:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

서비스는 `http://localhost:8000`에서 실행됩니다.

## API 엔드포인트

### `GET /`
서비스 정보 반환

### `GET /health`
헬스 체크

### `POST /detect`
품목 탐지

**Request Body:**
```json
{
  "image": "base64_encoded_image_string",
  "threshold": 0.5,  // 선택사항
  "nms_threshold": 0.4  // 선택사항
}
```

**Response:**
```json
{
  "detections": [
    {
      "label": "MAXIM_400",
      "confidence": 0.95,
      "box": {
        "x": 100.0,
        "y": 200.0,
        "w": 50.0,
        "h": 50.0
      }
    }
  ]
}
```

### `GET /labels`
사용 가능한 품목 라벨 목록 반환

## 모델 통합

현재는 더미 데이터를 반환합니다. 실제 YOLOv8 또는 ONNX 모델을 사용하려면:

1. `main.py`의 `load_model()` 함수 구현
2. `detect_items()` 함수에서 실제 모델 추론 코드 작성
3. `requirements.txt`에서 필요한 패키지 주석 해제

## 캘리브레이션 (선택)

AprilTag/ArUco 기반 캘리브레이션을 추가하려면:

1. `requirements.txt`에서 OpenCV 패키지 주석 해제
2. 캘리브레이션 로직 추가 (homography 계산)
