"""
캘리브레이션 모듈 (선택 구현)
AprilTag/ArUco 마커를 이용한 선반 좌표계 보정
"""
import cv2
import numpy as np
from typing import Optional, Tuple, List

# TODO: AprilTag 또는 ArUco 라이브러리 import
# import apriltag
# 또는
# from cv2 import aruco

def detect_markers(image: np.ndarray) -> Optional[List[Tuple[float, float]]]:
    """
    이미지에서 AprilTag/ArUco 마커를 탐지
    
    Args:
        image: 입력 이미지 (numpy 배열)
    
    Returns:
        마커의 4개 모서리 좌표 리스트 또는 None
    """
    # TODO: AprilTag/ArUco 마커 탐지 구현
    # 예시:
    # detector = apriltag.Detector()
    # tags = detector.detect(image)
    # if len(tags) == 4:  # 4개 모서리 마커 필요
    #     corners = [tag.corners for tag in tags]
    #     return corners
    return None

def compute_homography(
    source_points: List[Tuple[float, float]],
    target_points: List[Tuple[float, float]]
) -> Optional[np.ndarray]:
    """
    Homography 행렬 계산
    
    Args:
        source_points: 원본 이미지의 4개 점
        target_points: 목표 좌표계의 4개 점
    
    Returns:
        Homography 행렬 (3x3) 또는 None
    """
    if len(source_points) != 4 or len(target_points) != 4:
        return None
    
    src_pts = np.array(source_points, dtype=np.float32)
    dst_pts = np.array(target_points, dtype=np.float32)
    
    homography, _ = cv2.findHomography(src_pts, dst_pts)
    return homography

def apply_homography(
    image: np.ndarray,
    homography: np.ndarray,
    output_size: Tuple[int, int]
) -> np.ndarray:
    """
    Homography 변환을 이미지에 적용
    
    Args:
        image: 입력 이미지
        homography: Homography 행렬
        output_size: 출력 이미지 크기 (width, height)
    
    Returns:
        변환된 이미지
    """
    warped = cv2.warpPerspective(image, homography, output_size)
    return warped

def calibrate_shelf(image: np.ndarray) -> Optional[np.ndarray]:
    """
    선반 이미지를 캘리브레이션하여 정규화된 좌표계로 변환
    
    Args:
        image: 선반 이미지
    
    Returns:
        캘리브레이션된 이미지 또는 None (마커 탐지 실패 시)
    """
    # 1. 마커 탐지
    markers = detect_markers(image)
    if markers is None or len(markers) != 4:
        return None
    
    # 2. 목표 좌표계 정의 (선반의 정규화된 좌표)
    # 예: 선반 크기가 1000x500이라고 가정
    target_points = [
        (0, 0),      # 왼쪽 위
        (1000, 0),   # 오른쪽 위
        (1000, 500), # 오른쪽 아래
        (0, 500),    # 왼쪽 아래
    ]
    
    # 3. Homography 계산
    homography = compute_homography(markers, target_points)
    if homography is None:
        return None
    
    # 4. 이미지 변환
    calibrated_image = apply_homography(image, homography, (1000, 500))
    
    return calibrated_image
