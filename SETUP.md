# 설정 가이드

## 1. 환경 변수 설정

`.env.local` 파일을 프로젝트 루트에 생성하고 다음 변수를 설정하세요:

```env
# Google Generative AI (Gemini 2.5)
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here

# Camera Snapshot URL (IP 카메라 스냅샷 URL)
CAMERA_SNAPSHOT_URL=http://your-camera-ip/snapshot.jpg

# Detector Service URL (Python FastAPI 서비스)
DETECTOR_URL=http://localhost:8000
```

## 2. face-api.js 모델 파일 준비

`public/models/` 폴더에 다음 모델 파일을 다운로드하여 배치하세요:

필요한 모델 파일:
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model-shard1`
- `face_recognition_model-shard2`

다운로드 위치:
- [face-api.js 모델 파일](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)

또는 다음 명령어로 다운로드:

```bash
mkdir -p public/models
cd public/models

# tiny_face_detector
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1

# face_landmark_68
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1

# face_recognition
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2
```

## 3. Next.js 애플리케이션 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

애플리케이션은 `http://localhost:3000`에서 실행됩니다.

## 4. Python Detector 서비스 실행

```bash
cd detector

# 가상환경 생성 및 활성화
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 서비스 실행
python main.py
```

Detector 서비스는 `http://localhost:8000`에서 실행됩니다.

## 5. 테스트

1. 브라우저에서 `http://localhost:3000` 접속
2. "대여/반납 시작하기" 버튼 클릭
3. 대여 모달에서 테스트 진행

## 문제 해결

### 카메라 스냅샷 오류
- `CAMERA_SNAPSHOT_URL`이 올바른지 확인
- IP 카메라가 네트워크에 접근 가능한지 확인
- 카메라가 스냅샷 URL을 제공하는지 확인

### Detector 서비스 연결 오류
- Detector 서비스가 실행 중인지 확인 (`http://localhost:8000/health`)
- `DETECTOR_URL` 환경 변수가 올바른지 확인
- CORS 설정 확인 (개발 환경에서는 `allow_origins=["*"]`로 설정됨)

### 얼굴 인식 모델 로드 실패
- `public/models/` 폴더에 모델 파일이 있는지 확인
- 브라우저 콘솔에서 오류 메시지 확인
- 모델 파일이 올바르게 다운로드되었는지 확인

## 다음 단계

1. **YOLOv8/ONNX 모델 통합**: `detector/main.py`에서 실제 모델 로드 및 추론 구현
2. **데이터베이스 연동**: 대여 로그 저장을 위한 DB 설정
3. **얼굴 데이터베이스**: 알려진 얼굴 등록 및 관리 기능 구현
4. **캘리브레이션**: AprilTag/ArUco 마커 기반 선반 좌표계 보정 구현
