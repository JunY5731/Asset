/**
 * face-api.js를 사용한 얼굴 인식 유틸리티
 */
import * as faceapi from 'face-api.js';

let modelsLoaded = false;

/**
 * face-api.js 모델 로드
 */
export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) {
    return;
  }

  try {
    const MODEL_URL = '/models';
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);

    modelsLoaded = true;
    console.log('Face models loaded successfully');
  } catch (error) {
    console.error('Failed to load face models:', error);
    throw error;
  }
}

/**
 * 이미지에서 얼굴을 탐지하고 인식
 * @param imageElement HTMLImageElement 또는 HTMLVideoElement
 * @param knownFaces 알려진 얼굴 데이터베이스 (name, team, descriptor)
 * @returns 인식된 얼굴 정보 또는 null
 */
export async function recognizeFace(
  imageElement: HTMLImageElement | HTMLVideoElement,
  knownFaces: Array<{ name: string; team: string; descriptor: Float32Array }>
): Promise<{ name: string; team: string; confidence: number } | null> {
  if (!modelsLoaded) {
    await loadFaceModels();
  }

  try {
    // 얼굴 탐지
    const detections = await faceapi
      .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections.length === 0) {
      return null;
    }

    // 첫 번째 얼굴 사용
    const detectedDescriptor = detections[0].descriptor;

    // 알려진 얼굴과 비교
    let bestMatch: { name: string; team: string; distance: number } | null = null;
    const threshold = 0.6; // 인식 임계값 (낮을수록 엄격)

    for (const knownFace of knownFaces) {
      const distance = faceapi.euclideanDistance(
        detectedDescriptor,
        knownFace.descriptor
      );

      if (distance < threshold) {
        if (!bestMatch || distance < bestMatch.distance) {
          bestMatch = {
            name: knownFace.name,
            team: knownFace.team,
            distance,
          };
        }
      }
    }

    if (bestMatch) {
      return {
        name: bestMatch.name,
        team: bestMatch.team,
        confidence: 1 - bestMatch.distance, // 거리를 신뢰도로 변환
      };
    }

    return null;
  } catch (error) {
    console.error('Face recognition error:', error);
    return null;
  }
}

/**
 * 이미지에서 얼굴 디스크립터 추출 (등록용)
 */
export async function extractFaceDescriptor(
  imageElement: HTMLImageElement | HTMLVideoElement
): Promise<Float32Array | null> {
  if (!modelsLoaded) {
    await loadFaceModels();
  }

  try {
    const detection = await faceapi
      .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    return detection ? detection.descriptor : null;
  } catch (error) {
    console.error('Face descriptor extraction error:', error);
    return null;
  }
}
