import { NextRequest, NextResponse } from 'next/server';

/**
 * 카메라 스냅샷을 가져오는 API
 * IP 카메라의 스냅샷 URL에서 이미지를 fetch하여 반환
 */
export async function GET(request: NextRequest) {
  const cameraUrl = process.env.CAMERA_SNAPSHOT_URL;

  if (!cameraUrl) {
    return NextResponse.json(
      { error: 'CAMERA_SNAPSHOT_URL이 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(cameraUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/jpeg,image/png',
      },
      // 타임아웃 설정 (10초)
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`카메라 요청 실패: ${response.status} ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('카메라 스냅샷 가져오기 실패:', error);
    return NextResponse.json(
      { 
        error: '카메라 스냅샷을 가져올 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
