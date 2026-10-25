# 궁합 — 입력 (두 사람·관계 유형·연도)

| | |
|---|---|
| 상태 | 초안 — `docs/frontend`의 화면 명세·시나리오(코드를 설명한 글)를 2026-10-17에 옮겨 둔 것. 아직 스펙 형식(`specs/README.md` 템플릿: 규칙·수용 기준)으로 바꾸지 않았다 — 이 화면을 손댈 때 약속과 수용 기준으로 다시 쓴다 |
| 화면 | `/compatibility` 폼 단계(프로필·직접 입력·혼합·초대 링크). 결과 단계는 `specs/compatibility/result.md` |

## 화면 명세 (옛 screen_spec)

**진입 조건:** 로그인 필수 — 비로그인은 `LoginRequired` 카드 → `/join`(복귀 경로는 sessionStorage `kkachi_login_next`). 결제 게이트 없음.

```
PersonCard × 2 (프로필/직접) + 관계 유형(lover|friend|family) + 연도 → "궁합 보기"
  → 둘 다 프로필: POST /compatibility (캐시)   그 외: POST /compatibility/direct
  → CompatibilityResult 7탭(?tab=; 오늘의 궁합 탭 진입 시 GET /compatibility/daily, 프로필×2일 때만) + 즉시 POST /compatibility/narrative 스트리밍
  → 헤더 "궁합 공유" → POST /compatibility/shares → /s/{id}
  → sessionStorage kkachi_compat_input · kkachi_compat_names → CompatibilityChat FAB
```

- `?p1=&p2=` 딥링크: p1 기본 is_self, p2 기본 비-self
- 결과 단계는 `specs/compatibility/result.md`

---


## 관련 페이지 / API

| 경로 | 역할 |
|------|------|
| `/compatibility` | 궁합 분석 페이지 (`?p1=&p2=` 프로필 딥링크) |
| `/compatibility/chat` | 궁합 상담 챗 |
| `POST /compatibility` | 저장된 프로필 2개 기반 궁합 (캐시 적용) |
| `POST /compatibility/direct` | 직접 입력·혼합 기반 stateless 궁합 |
| `POST /compatibility/narrative` | LLM 종합해석 스트리밍 |
| `POST /compatibility/chat` | LLM 상담 챗 스트리밍 |

모든 요청에 `relation_type: "lover" | "friend" | "family"` (기본 `lover`). 관계 유형에 따라 영역 라벨·prose·라벨 문구가 달라진다.

---

## 시나리오 1 — 프로필 기반 궁합 (로그인 + 프로필 2개 이상)

1. `/compatibility` 진입 → 프로필 목록 자동 로드
   - 인물 1 기본: `?p1=` → 없으면 `is_self` → 없으면 첫 프로필
   - 인물 2 기본: `?p2=` → 없으면 인물 1이 아닌 비-self 프로필 → 없으면 인물 1이 아닌 첫 프로필
   - 홈 FortunePost "나와 궁합보기"가 `/compatibility?p2={profileId}`로 연결
2. 관계 유형(연인·부부 / 친구·동료 / 가족) 선택 + 같은 줄 오른쪽에 분석 연도 (기본 올해), 그 아래 전체 폭 [궁합 보기] 하나 (2026-10-25). 초대 링크면 관계 유형이 숨고 연도가 줄을 채운다
3. "궁합 보기" → `POST /compatibility`
   - 동일 프로필 조합 + 연도 → 캐시 우선 반환 (`profile_id_1 < profile_id_2` 정규화)
   - 캐시 hit 시에도 `relation_type`별 prose는 재적용

## 시나리오 2 — 직접 입력 궁합 (비로그인 가능)

1. 인물 1 · 인물 2 "직접 입력" 모드 → 이름 · 생년월일 · 태어난 시간 · 성별 · 도시
   - 도시 기본값: `ipapi.co` IP 위치 감지
   - 태어난 시간 모를 때: 정오(12:00)
2. "궁합 보기" → `POST /compatibility/direct` (stateless, 캐시 없음)

## 시나리오 3 — 혼합 모드

- 인물 1 프로필 / 인물 2 직접 입력 조합 가능 → `POST /compatibility/direct`

## 시나리오 4 — 결과 화면

결과 단계(인트로·문답·7탭·다음 이야기·공유)는 **`specs/compatibility/result.md`** 가 정식 스펙이다. 이 파일은 입력 폼까지만 다룬다.

## 데이터 흐름

```
POST /compatibility
  Request:  { profile_id_1, profile_id_2, year, relation_type }
  Response: CompatibilityResult (compatibilities 캐시 우선)

POST /compatibility/direct
  Request:  { person1: {name, gender, birth_dt, city}, person2, year, relation_type }
  Response: CompatibilityResult (항상 새로 계산)

POST /compatibility/narrative | /chat
  → text/plain 스트림 (Ollama 없으면 빈 응답)
```

---

## 구현 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-04-08 | 궁합 페이지 초기 구현, 프로필/직접 입력 모드, PersonCard |
| 2026-05-25 | 결과 화면 전면 개편 — prose 풀이·라더 차트·신살 상세화 |
| 2026-05-24 | 점수 모델을 같은 기둥 4쌍으로 단순화 + 삼합(반합·완성) + 천간충, `/payment` 게이트 제거 |
| 2026-05-25 | 관계 유형(연인·친구·가족) 도입, 프로필 딥링크(`is_self` + URL), AI 종합해석 스트리밍 |
| 2026-05-25 | 궁합 챗을 `/compatibility/chat` 페이지로 분리 |
| 2026-09-28 | 결과가 폼을 대체, 3탭(`?tab=`), 궁합 공유 카드(`/s/{id}`), 초대 링크 생성 UI 제거, 로그인 필수 |
| 2026-10-02 | 종합 탭을 한눈에(종합 카드 + 탭별 요약, 백엔드 `compatibility_summary`)로 확장 |
| 2026-10-02 | 탭 재배치 — 팔자비교 = 기둥 비교 + 오행 보완, 성격·성질 = 신살 + 신강·신약 (옛 `?tab=element`·`?tab=sinsal` 호환) |
| 2026-10-02 | 신강·신약 카드(팔자비교) · 띠궁합 탭(띠 충합·연도별 띠 궁합, 백엔드 `compatibility_zodiac`) 추가 |
| 2026-10-02 | 신살 만남 탭을 팔자비교 아래로 합침(6탭, 옛 `?tab=sinsal` 호환) |
| 2026-10-09 | 궁합 공유 카드(`/s/{id}`)·OG·공유 문구에 캐릭터 칭호·역할(`character`) — 그림은 `compat/{key}.png` 생기면 자동 노출 |
| 2026-10-02 | 7탭으로 재구성(`components/compatibility/` 분할, 팔자비교·오행 보완·신살 만남·오늘의 궁합) + 홈 "오늘 나와 N점" 배지 표시 조건 수정 |
| 2026-10-25 | 관계 유형과 분석 연도를 한 줄로, [궁합 보기]는 그 아래 전체 폭 하나 — 모바일 폼 높이 줄임 |

---

## 미결 사항 / 개선 검토

- [x] 영역별 궁합 카드 구조·시각화 추가 다듬기 (2026-10-02 탭 분리 + pros/cons 칩)
- [x] 궁합 결과 공유 기능 (2026-09-28 공유 카드 `/s/{id}`)
- [ ] 프로필 1개만 있을 때 인물 2 자동 직접 입력 강제

> 결과 화면 쪽 미결(언제가 좋을까 탭, 탭 전환마다 재호출, 신살 카드 포맷)은 `specs/compatibility/result.md` 6장으로 옮겼다.
