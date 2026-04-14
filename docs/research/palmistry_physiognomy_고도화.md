# 손금·관상 고도화 리서치

## 1. 손금 고도화

### 현재 방식의 문제

`palmistry_controller.py`의 `_analyze_palm_lines()`는 다음 파이프라인으로 동작합니다.

```
RGB → CLAHE → GaussianBlur(7,7) → Canny(25,75) → band_score(엣지 밀도)
```

핵심 문제는 "엣지 밀도가 높으면 선이 선명하다"는 가정이 틀렸다는 점입니다. 손금 영역에는 주름, 손톱 경계, 조명 그림자 등 손금이 아닌 엣지가 훨씬 많습니다. 따라서 어두운 피부나 강한 조명에서 점수가 뒤집힙니다.

### Phase 1 — 즉시 개선 (코드 변경만)

**1. Otsu 자동 임계값으로 전환**

```python
# 현재: 고정 Canny
edges = cv2.Canny(blurred, 25, 75)

# 개선: Otsu 자동 임계값
otsu_val, _ = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
edges = cv2.Canny(blurred, otsu_val * 0.3, otsu_val * 0.8)
```

**2. YCrCb 피부 마스크 적용**

```python
ycrcb = cv2.cvtColor(roi, cv2.COLOR_RGB2YCrCb)
skin_mask = cv2.inRange(ycrcb, (0, 133, 77), (255, 173, 127))
edges = cv2.bitwise_and(edges, edges, mask=skin_mask)
```

**3. 형태학 연산으로 선 연속성 보강**

```python
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
```

**4. 운명선(fate line) 추가**
- 손바닥 세로 중앙 밴드 (손목→중지MCP 수직선 ±15%)
- 콘텐츠 볼륨 25% 증가, 코드 변경만으로 즉시 가능

**5. 신뢰도(confidence) 반환**
- CLAHE 히스토그램 편향 또는 ROI가 작으면 confidence 낮춤
- 프론트엔드에서 낮은 confidence 시 "재촬영을 권장합니다" 안내

### Phase 2 — 딥러닝 세그멘테이션 (3~6개월)

관련 논문:
- [Efficient Palm-Line Segmentation with U-Net Context Fusion Module](https://arxiv.org/abs/2102.12127) (2021) — F1 99.42%, mIoU 0.584. 데이터셋 비공개.
- [Palmistry-Informed Feature Extraction using ML](https://arxiv.org/abs/2509.02248) (2025) — CNN + Random Forest. 코드 비공개.
- [Roboflow Palm Line Detection Dataset](https://universe.roboflow.com/palm-reading-test/palm-line-detection-9zzh0) — 46장. 데이터 규모 너무 작음.

**현실적 결론:** 공개된 고품질 손금선 세그멘테이션 데이터셋이 없음. 자체 수집 필요 (최소 500장, 권장 2,000장). 데이터 없을 때 대안: GPT-4V / Claude Vision에 이미지 + "생명선·감정선·지능선 선명도를 1~5로 평가" 프롬프트.

---

## 2. 관상(顔相) 고도화

### MediaPipe Face Landmarker 랜드마크 (478개)

**얼굴형 분류에 필요한 인덱스:**

| 부위 | 인덱스 | 계산식 |
|------|--------|--------|
| 이마 너비 | 54, 284 | `forehead_w = dist(54, 284)` |
| 광대 너비 | 234, 454 | `cheekbone_w = dist(234, 454)` |
| 턱 너비 | 172, 397 | `jaw_w = dist(172, 397)` |
| 얼굴 길이 | 10, 152 | `face_h = dist(10, 152)` |
| 눈 종횡비 | 33, 133, 159, 145 | `eye_ar = height / width` |
| 눈꼬리 각도 | 33, 133 | `atan2(dy, dx)` |
| 코 너비 | 49, 279 | `nose_w = dist(49, 279)` |
| 입술 너비 | 61, 291 | `lip_w = dist(61, 291)` |
| 인중 길이 | 2, 0 | `philtrum_h = dist(2, 0)` |

**오행형 얼굴 분류 규칙:**

```python
face_index = face_h / cheekbone_w
jaw_taper = jaw_w / cheekbone_w
forehead_taper = forehead_w / cheekbone_w

if face_index > 1.5 and jaw_taper < 0.75:             # 木형: 역삼각형
elif face_index > 1.35 and jaw_taper > 0.85:           # 火형: 긴 타원
elif face_index < 1.2 and jaw_taper > 0.9:             # 水형: 둥근형
elif abs(jaw_w - cheekbone_w) < 0.1 * cheekbone_w:    # 金형: 사각형
else:                                                   # 土형: 마름모
```

### 전통 오관(五官) 오행(五行) 배치

| 오관 | 오행 | 관상학적 기준 |
|------|------|------------|
| 눈(目) | 木 | 눈꼬리 올라감·길고 좁음 = 木旺, 큰 눈·둥금 = 火 |
| 귀(耳) | 水 | 귓불 두껍고 길면 수명, 이륜 선명 = 지혜 |
| 코(鼻) | 土 | 코 두툼하고 넓으면 재물, 코 끝 둥금 = 인덕 |
| 입(口) | 水/火 | 입꼬리 올라감 = 구설수 없음, 인중 길면 장수 |
| 이마(額) | 火 | 이마 넓고 볼록 = 관운, 이마 좁음 = 초년 고생 |
| 눈썹(眉) | 木 | 눈썹 진하고 선명 = 형제운 |

### 국내외 서비스 현황

- **AI 관상 & 타로**: 랜드마크 기반, 조명·안경에 민감. 연예인 학습 데이터라 일반인 정확도 낮음.
- **Jenova AI**: GPT-4V + 관상학 프롬프트 래퍼로 추정.
- **Face++**: 얼굴 속성(나이·성별·감정) 특화, 관상 운세 해석 없음.
- **국민대 FACE FRIEND (2024)**: MediaPipe Face Landmarker 기반 오관 분석 학술 프로젝트. 구현 패턴 참고 가능.

**핵심 인사이트:** 상용 서비스 대부분이 "랜드마크 비율 → 규칙 기반 해석" OR "Vision LLM + 관상학 프롬프트" 두 패턴 중 하나. 별도 관상 전용 ML 모델 학습 사례 없음.

---

## 3. 사주까치 차별화 포인트

**사주 + 손금/관상 통합 해석** — 경쟁 서비스에 없는 유일한 포지션

예시:
> "火 기운이 강한 사주답게 감정선도 선명하네요. 열정과 표현력이 손금에도 드러납니다."

구현: `POST /palmistry/analyze`에 선택적 `birth_dt` + `gender` 파라미터 추가 → 사주 용신 정보를 `PalmLineInterpreter`에 컨텍스트로 전달.

---

## 4. 우선순위 로드맵

| 과제 | 난이도 | 체감 품질 | 데이터 필요 | 추천 시기 |
|------|--------|---------|------------|---------|
| 손금 Otsu+스킨마스크 개선 | 낮음 (1일) | +10~15% | 불필요 | 즉시 |
| 손금 운명선 추가 | 낮음 (0.5일) | 콘텐츠 +25% | 불필요 | 즉시 |
| 손금 신뢰도 반환 | 낮음 (0.5일) | UX 개선 | 불필요 | 즉시 |
| 관상 랜드마크 비율 분석 | 중간 (3~5일) | 신기능 | 불필요 | 2~4주 |
| 관상 + LLM 해석 연동 | 중간 (2~3일) | 매우 높음 | 불필요 | 2~4주 |
| 손금·관상 + 사주 통합 해석 | 중간 (2일) | 차별화 | 불필요 | 2~4주 |
| 손금 딥러닝 세그멘테이션 | 높음 (2~4주) | 매우 높음 | 500장+ | 3~6개월 |

---

## 참고 자료

- [Efficient Palm-Line Segmentation with U-Net Context Fusion Module](https://arxiv.org/abs/2102.12127)
- [Palmistry-Informed Feature Extraction using ML](https://arxiv.org/abs/2509.02248)
- [Deep Learning in Palmprint Recognition Survey](https://arxiv.org/html/2501.01166v1)
- [Roboflow Palm Line Detection Dataset](https://universe.roboflow.com/palm-reading-test/palm-line-detection-9zzh0)
- [MediaPipe Face Landmarker](https://developers.google.com/mediapipe/solutions/vision/face_landmarker)
- [ONNX Runtime Web + WebGPU](https://opensource.microsoft.com/blog/2024/02/29/onnx-runtime-web-unleashes-generative-ai-in-the-browser-using-webgpu/)
- [국민대 FACE FRIEND 2024](https://github.com/kookmin-sw/capstone-2024-18)
