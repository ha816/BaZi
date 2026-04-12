import io
import math
from dataclasses import asdict
from pathlib import Path

import mediapipe as mp
import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
from PIL import Image

from kkachi.application.interpreter.hand_shape import HandShapeInterpreter, PalmLineInterpreter, classify_hand_type

palmistry_router = APIRouter()

_MODEL_PATH = Path(__file__).parent.parent.parent / "resource" / "hand_landmarker.task"

_base_options = mp_python.BaseOptions(model_asset_path=str(_MODEL_PATH))
_landmarker_options = mp_vision.HandLandmarkerOptions(
    base_options=_base_options,
    num_hands=1,
    min_hand_detection_confidence=0.5,
    min_hand_presence_confidence=0.5,
    min_tracking_confidence=0.5,
)


def _analyze_palm_lines(img_array: np.ndarray, landmarks, img_w: int, img_h: int) -> dict[str, int]:
    """생명선·지능선·감정선 엣지 밀도 분석 → 0~100 점수 반환."""
    try:
        import cv2
    except ImportError:
        return {"heart": 50, "head": 50, "life": 50}

    def px(lm) -> tuple[int, int]:
        return int(lm.x * img_w), int(lm.y * img_h)

    wrist = px(landmarks[0])
    thumb_mcp = px(landmarks[2])
    index_mcp = px(landmarks[5])
    middle_mcp = px(landmarks[9])
    ring_mcp = px(landmarks[13])
    pinky_mcp = px(landmarks[17])

    # 손바닥 ROI 박스
    all_xs = [px(lm)[0] for lm in landmarks]
    all_ys = [px(lm)[1] for lm in landmarks]
    pad = max(img_w, img_h) // 25
    x0 = max(0, min(all_xs) - pad)
    y0 = max(0, min(all_ys) - pad)
    x1 = min(img_w, max(all_xs) + pad)
    y1 = min(img_h, max(all_ys) + pad)

    roi = img_array[y0:y1, x0:x1]
    rh, rw = roi.shape[:2]
    if rh < 20 or rw < 20:
        return {"heart": 50, "head": 50, "life": 50}

    def r(pt: tuple[int, int]) -> tuple[int, int]:
        return (pt[0] - x0, pt[1] - y0)

    # 전처리: CLAHE → 가우시안 블러 → Canny
    gray = cv2.cvtColor(roi, cv2.COLOR_RGB2GRAY)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    blurred = cv2.GaussianBlur(enhanced, (7, 7), 1.5)
    edges = cv2.Canny(blurred, 25, 75)

    # 손바닥 기준 좌표 (ROI 기준)
    mcp_ys = [r(index_mcp)[1], r(middle_mcp)[1], r(ring_mcp)[1], r(pinky_mcp)[1]]
    mcp_y = int(sum(mcp_ys) / len(mcp_ys))
    wrist_ry = r(wrist)[1]
    if wrist_ry < mcp_y:  # 손 방향 보정
        mcp_y, wrist_ry = wrist_ry, mcp_y
    palm_h = max(1, wrist_ry - mcp_y)

    finger_xs = sorted([r(index_mcp)[0], r(middle_mcp)[0], r(ring_mcp)[0], r(pinky_mcp)[0]])
    palm_x_left, palm_x_right = finger_xs[0], finger_xs[-1]
    palm_w = max(1, palm_x_right - palm_x_left)

    thumb_rx = r(thumb_mcp)[0]
    thumb_is_left = thumb_rx < (palm_x_left + palm_x_right) // 2

    def band_score(y_top: int, y_bot: int, x_left: int, x_right: int) -> int:
        y_top = max(0, min(rh - 1, y_top))
        y_bot = max(y_top + 1, min(rh, y_bot))
        x_left = max(0, min(rw - 1, x_left))
        x_right = max(x_left + 1, min(rw, x_right))
        region = edges[y_top:y_bot, x_left:x_right]
        if region.size == 0:
            return 50
        density = float(np.count_nonzero(region)) / region.size
        return int(min(95, max(20, density * 300 + 15)))

    # 감정선: MCP 바로 아래 수평 띠
    heart_score = band_score(
        mcp_y,
        mcp_y + int(palm_h * 0.22),
        palm_x_left - int(palm_w * 0.05),
        palm_x_right + int(palm_w * 0.05),
    )

    # 지능선: 손바닥 중앙부 수평 띠
    head_score = band_score(
        mcp_y + int(palm_h * 0.30),
        mcp_y + int(palm_h * 0.55),
        palm_x_left - int(palm_w * 0.05),
        palm_x_right + int(palm_w * 0.05),
    )

    # 생명선: 엄지 측 세로 띠
    if thumb_is_left:
        lx0 = max(0, thumb_rx - int(palm_w * 0.10))
        lx1 = palm_x_left + int(palm_w * 0.45)
    else:
        lx0 = palm_x_right - int(palm_w * 0.45)
        lx1 = min(rw, thumb_rx + int(palm_w * 0.10))
    life_score = band_score(mcp_y + int(palm_h * 0.15), wrist_ry, lx0, lx1)

    return {"heart": heart_score, "head": head_score, "life": life_score}


def _dist(a, b) -> float:
    return math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)


def _extract_metrics(landmarks) -> tuple[float, float]:
    """21개 랜드마크 → (finger_ratio, aspect_ratio)."""
    palm_width = _dist(landmarks[5], landmarks[17])   # 검지MCP ~ 소지MCP
    palm_height = _dist(landmarks[0], landmarks[9])   # 손목 ~ 중지MCP
    middle_len = _dist(landmarks[9], landmarks[12])   # 중지MCP ~ TIP

    finger_ratio = middle_len / palm_width if palm_width > 0 else 0.7
    aspect_ratio = palm_height / palm_width if palm_width > 0 else 1.1
    return round(finger_ratio, 3), round(aspect_ratio, 3)


@palmistry_router.post("/palmistry/analyze")
async def analyze_palmistry(image: UploadFile = File(...)) -> dict:
    content = await image.read()
    try:
        pil_img = Image.open(io.BytesIO(content)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="이미지를 읽을 수 없습니다.")

    img_array = np.array(pil_img, dtype=np.uint8)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_array)

    with mp_vision.HandLandmarker.create_from_options(_landmarker_options) as landmarker:
        result = landmarker.detect(mp_image)

    if not result.hand_landmarks:
        raise HTTPException(
            status_code=422,
            detail="손이 감지되지 않았습니다. 손바닥이 잘 보이도록, 밝은 곳에서 다시 찍어주세요.",
        )

    landmarks = result.hand_landmarks[0]
    finger_ratio, aspect_ratio = _extract_metrics(landmarks)
    hand_type = classify_hand_type(finger_ratio, aspect_ratio)

    img_h, img_w = img_array.shape[:2]
    line_scores = _analyze_palm_lines(img_array, landmarks, img_w, img_h)

    shape_blocks = HandShapeInterpreter()(hand_type, finger_ratio, aspect_ratio)
    line_blocks = PalmLineInterpreter()(line_scores)

    return {
        "hand_element": hand_type.name,
        "hand_type_korean": shape_blocks[0].description.split(" — ")[0],
        "finger_ratio": finger_ratio,
        "aspect_ratio": aspect_ratio,
        "line_scores": line_scores,
        "blocks": [asdict(b) for b in shape_blocks + line_blocks],
    }