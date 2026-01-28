import { NextRequest, NextResponse } from 'next/server';
import { Detection } from '@/types/detector';

interface DetectorResponse {
  detections: Detection[];
}

/**
 * 대여 확정 API
 * 1. before 이미지 캡처
 * 2. 2초 대기
 * 3. after 이미지 캡처
 * 4. 각각에 대해 detector 호출
 * 5. before에는 있고 after에 없는 품목을 items_taken으로 판단
 */
export async function POST(request: NextRequest) {
  const detectorUrl = process.env.DETECTOR_URL || 'http://localhost:8000';
  const cameraUrl = process.env.CAMERA_SNAPSHOT_URL;

  if (!cameraUrl) {
    return NextResponse.json(
      { error: 'CAMERA_SNAPSHOT_URL이 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { borrowerName, borrowerTeam } = body;

    // 1. before 이미지 캡처
    const beforeResponse = await fetch(cameraUrl, {
      method: 'GET',
      headers: { 'Accept': 'image/jpeg,image/png' },
      signal: AbortSignal.timeout(10000),
    });

    if (!beforeResponse.ok) {
      throw new Error('before 이미지 캡처 실패');
    }

    const beforeImageBuffer = await beforeResponse.arrayBuffer();
    const beforeImageBase64 = Buffer.from(beforeImageBuffer).toString('base64');

    // 2. 2초 대기
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. after 이미지 캡처
    const afterResponse = await fetch(cameraUrl, {
      method: 'GET',
      headers: { 'Accept': 'image/jpeg,image/png' },
      signal: AbortSignal.timeout(10000),
    });

    if (!afterResponse.ok) {
      throw new Error('after 이미지 캡처 실패');
    }

    const afterImageBuffer = await afterResponse.arrayBuffer();
    const afterImageBase64 = Buffer.from(afterImageBuffer).toString('base64');

    // 4. Detector 서비스 호출 (before)
    const beforeDetections = await callDetector(detectorUrl, beforeImageBase64);
    
    // 5. Detector 서비스 호출 (after)
    const afterDetections = await callDetector(detectorUrl, afterImageBase64);

    // 6. before에는 있고 after에 없는 품목 찾기
    const beforeLabels = new Set(beforeDetections.map(d => d.label));
    const afterLabels = new Set(afterDetections.map(d => d.label));
    
    const itemsTaken = Array.from(beforeLabels).filter(label => !afterLabels.has(label));

    // 7. 결과 반환 (실제로는 DB에 저장해야 함)
    const loanLog = {
      borrowerName,
      borrowerTeam,
      itemsTaken,
      timestamp: new Date().toISOString(),
      beforeDetections: beforeDetections.map(d => d.label),
      afterDetections: afterDetections.map(d => d.label),
      // 이미지는 옵션으로 base64로 저장하거나 파일로 저장 가능
      beforeImage: beforeImageBase64,
      afterImage: afterImageBase64,
    };

    // TODO: 실제 DB 저장 로직 추가
    // await saveLoanLog(loanLog);

    return NextResponse.json({
      success: true,
      loanLog,
      itemsTaken,
    });
  } catch (error) {
    console.error('대여 확정 처리 실패:', error);
    return NextResponse.json(
      {
        error: '대여 확정 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * Detector 서비스 호출 헬퍼 함수
 */
async function callDetector(
  detectorUrl: string,
  imageBase64: string
): Promise<Detection[]> {
  try {
    const response = await fetch(`${detectorUrl}/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
      }),
      signal: AbortSignal.timeout(30000), // 30초 타임아웃
    });

    if (!response.ok) {
      throw new Error(`Detector 서비스 오류: ${response.status} ${response.statusText}`);
    }

    const data: DetectorResponse = await response.json();
    return data.detections || [];
  } catch (error) {
    console.error('Detector 호출 실패:', error);
    // Detector 실패 시 빈 배열 반환 (에러를 throw하지 않고 계속 진행)
    return [];
  }
}
