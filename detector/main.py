"""
품목 탐지 마이크로서비스 (FastAPI)
YOLOv8/ONNX 기반 품목 인식 서비스
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import io
from PIL import Image
import numpy as np
from typing import List, Optional
import os

app = FastAPI(title="Asset Detector Service", version="1.0.0")

# CORS 설정 (Next.js에서 호출 가능하도록)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 설정 상수
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.5"))
NMS_THRESHOLD = float(os.getenv("NMS_THRESHOLD", "0.4"))

# 품목 라벨 정의 (사내 품목명)
ITEM_LABELS = [
    "MAXIM_400",
    "KLEENEX_PINK",
    "KLEENEX_WHITE",
    "NOTEBOOK_A4",
    "PEN_BLACK",
    "PEN_BLUE",
    # 추가 품목명을 여기에 정의
]

class DetectionRequest(BaseModel):
    image: str  # base64 인코딩된 이미지
    threshold: Optional[float] = None
    nms_threshold: Optional[float] = None

class Box(BaseModel):
    x: float
    y: float
    w: float
    h: float

class Detection(BaseModel):
    label: str
    confidence: float
    box: Box

class DetectionResponse(BaseModel):
    detections: List[Detection]

# TODO: 실제 YOLOv8/ONNX 모델 로드
# from ultralytics import YOLO
# model = YOLO("path/to/model.pt")  # 또는 .onnx

def load_model():
    """
    모델 로드 함수
    실제 구현 시 YOLOv8 또는 ONNX 모델을 로드
    """
    # TODO: 모델 로드 구현
    # return model
    return None

model = load_model()

def detect_items(image: np.ndarray, threshold: float = CONFIDENCE_THRESHOLD) -> List[Detection]:
    """
    이미지에서 품목을 탐지하는 함수
    
    Args:
        image: numpy 배열 이미지
        threshold: 신뢰도 임계값
    
    Returns:
        Detection 리스트
    """
    # TODO: 실제 YOLOv8/ONNX 모델 추론 구현
    # results = model(image, conf=threshold, iou=NMS_THRESHOLD)
    # detections = []
    # for result in results:
    #     boxes = result.boxes
    #     for box in boxes:
    #         label_id = int(box.cls[0])
    #         confidence = float(box.conf[0])
    #         x, y, w, h = box.xywh[0].tolist()
    #         detections.append(Detection(
    #             label=ITEM_LABELS[label_id] if label_id < len(ITEM_LABELS) else f"ITEM_{label_id}",
    #             confidence=confidence,
    #             box=Box(x=x, y=y, w=w, h=h)
    #         ))
    # return detections
    
    # MVP: 더미 데이터 반환 (실제 모델 연결 전까지)
    # 실제 구현 시 위의 주석 처리된 코드를 사용
    return []

@app.get("/")
async def root():
    return {
        "service": "Asset Detector Service",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/detect", response_model=DetectionResponse)
async def detect(request: DetectionRequest):
    """
    이미지에서 품목을 탐지하는 엔드포인트
    
    입력: base64 인코딩된 이미지
    출력: 탐지된 품목 리스트 (label, confidence, box)
    """
    try:
        # Base64 디코딩
        image_data = base64.b64decode(request.image)
        image = Image.open(io.BytesIO(image_data))
        
        # RGB로 변환 (RGBA 등 대비)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # NumPy 배열로 변환
        image_array = np.array(image)
        
        # 임계값 설정
        threshold = request.threshold or CONFIDENCE_THRESHOLD
        nms_threshold = request.nms_threshold or NMS_THRESHOLD
        
        # 품목 탐지
        detections = detect_items(image_array, threshold=threshold)
        
        return DetectionResponse(detections=detections)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"탐지 처리 중 오류: {str(e)}")

@app.get("/labels")
async def get_labels():
    """사용 가능한 품목 라벨 목록 반환"""
    return {"labels": ITEM_LABELS}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
