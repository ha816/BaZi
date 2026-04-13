# 궁합 시나리오

## 관련 페이지 / API

| 경로 | 역할 |
|------|------|
| `/compatibility` | 궁합 분석 페이지 |
| `POST /compatibility` | 저장된 프로필 2개 기반 궁합 (캐시 적용) |
| `POST /compatibility/direct` | 직접 입력 기반 stateless 궁합 |

---

## 시나리오 1 — 프로필 기반 궁합 (로그인 + 프로필 2개 이상)

1. `/compatibility` 진입 → 프로필 목록 자동 로드
2. 인물 1 · 인물 2 각각 "저장된 프로필" 모드 선택 → 드롭다운에서 선택
3. 분석 연도 선택 (기본: 올해)
4. "궁합 보기" 클릭 → `POST /compatibility` 호출
   - 동일 프로필 조합 + 연도 → 캐시 우선 반환
   - `profile_id_1 < profile_id_2` 정규화로 순서 무관

---

## 시나리오 2 — 직접 입력 궁합 (비로그인 가능)

1. 인물 1 · 인물 2 각각 "직접 입력" 모드 선택
2. 이름 · 생년월일 · 태어난 시간 · 성별 · 도시 입력
   - 도시 기본값: `ipapi.co` IP 위치 감지
   - 태어난 시간 모를 때: 정오(12:00) 처리
3. "궁합 보기" 클릭 → `POST /compatibility/direct` 호출 (stateless, 캐시 없음)

---

## 시나리오 3 — 혼합 모드

- 인물 1: 저장된 프로필 / 인물 2: 직접 입력 조합 가능
- 혼합 모드는 `POST /compatibility/direct` 호출 (캐시 미적용)

---

## 시나리오 4 — 결과 표시

`CompatibilityResult` 컴포넌트:
- 종합 궁합 점수 (0~100)
- 오행 상생·상극 분석
- 영역별 점수 (애정·소통·가치관·재물·미래)
- 강점 / 주의 포인트

---

## 데이터 흐름

```
POST /compatibility
  Request: { profile_id_1, profile_id_2, year }
  Response: CompatibilityResult (캐시 우선)

POST /compatibility/direct
  Request: { person1: {name, gender, birth_dt, city}, person2, year }
  Response: CompatibilityResult (항상 새로 계산)
```

---

## 구현 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-04-08 | 궁합 페이지 초기 구현, 프로필/직접 입력 모드, PersonCard 컴포넌트 |
| 2026-04-08 | 오작교 콘셉트 — 궁합 기능 서비스 정체성 연계 |

---

## 미결 사항 / 개선 검토

- [ ] 프로필 1개만 있을 때 인물 2는 항상 직접 입력으로 강제
- [ ] 궁합 결과 공유 기능 (URL 파라미터 or 이미지 캡처)
- [ ] 비로그인 결과 블러 CTA → 로그인 유도
