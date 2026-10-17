# 손금 분석

| | |
|---|---|
| 상태 | 초안 — `docs/frontend`의 화면 명세·시나리오(코드를 설명한 글)를 2026-10-17에 옮겨 둔 것. 아직 스펙 형식(`specs/README.md` 템플릿: 규칙·수용 기준)으로 바꾸지 않았다 — 이 화면을 손댈 때 약속과 수용 기준으로 다시 쓴다 |
| 화면 | `/palmistry` — 네비 미연결, URL 직접 진입 |

## 화면 명세 (옛 screen_spec)

**진입 조건:** 없음. 네비 미연결.

```
idle → preview → loading → result
                        ↘ error (손 미감지 422 / 이미지 오류 400)
```

- `POST /palmistry/analyze` multipart `image`
- 결과: `hand_element`(오행형) · `hand_type_korean` · `finger_ratio`/`aspect_ratio` · `line_scores{heart,head,life}` · `blocks[]`
- 백엔드 필요 파일: `src/kkachi/resource/hand_landmarker.task` (git 미추적)

---


## 관련 페이지 / API

| 경로 | 역할 |
|------|------|
| `/palmistry` | 손금 분석 페이지 |
| `POST /palmistry/analyze` | 손바닥 이미지 → 손금 분석 결과 |

---

## 시나리오 1 — 이미지 업로드 및 분석

1. `/palmistry` 진입 → 촬영 가이드 표시
   - 밝은 곳, 손바닥 정면, 손가락 펼치기, 손 전체 포함
2. "손바닥 사진 올리기" 버튼 → 파일 선택 (카메라/갤러리)
3. 미리보기(preview) 표시 → "분석하기" 클릭
4. `POST /palmistry/analyze` 호출 (multipart/form-data, `image` 필드)
5. 성공 시 결과 렌더

---

## 시나리오 2 — 분석 결과 표시

| 섹션 | 내용 |
|------|------|
| 손금 점수 | 생명선·감정선·지혜선·운명선 각 점수 (0~100) |
| 오행 기운 | 손금에서 읽은 주 오행 |
| 해석 | 각 선별 KkachiTip 해석 |
| 종합 | 전체 기운 요약 |

---

## 기술 스택

- **MediaPipe Hand Landmarker**: 손 랜드마크 21개 검출
- **OpenCV**: 손금 라인 추출 (Canny edge detection)
- **모델 파일**: `src/kkachi/resource/hand_landmarker.task`

---

## 데이터 흐름

```
POST /palmistry/analyze
  Request: multipart/form-data { image: File }
  → PalmistryAdapter
      → MediaPipe Hand Landmarker → 21 landmarks
      → OpenCV 손금 라인 분석
      → 오행 매핑
  Response: { palm_lines: PalmLineScores, element: str, interpretation: str, ... }
```

---

## 구현 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-04-13 | 초기 구현: MediaPipe + OpenCV 손금 분석, /palmistry 페이지, BottomNav 탭 추가 |

---

## 미결 사항 / 개선 검토

- [ ] 손 감지 실패 시 재촬영 유도 (현재 에러 메시지만)
- [ ] 좌손 / 우손 선택 옵션 (현재 단일)
- [ ] 사주 분석 결과와 손금 결과 교차 해석
- [ ] 관상 분석 기능 연계 (docs/research/palmistry_physiognomy_고도화.md 참조)
