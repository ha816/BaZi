# 궁합 시나리오

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
2. 관계 유형(연인·부부 / 친구·동료 / 가족) 선택, 분석 연도 (기본 올해)
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

## 시나리오 4 — 결과 표시 (7탭, `?tab=`)

1. 결과가 폼을 대체. 헤더 "궁합 공유"(`POST /compatibility/shares` → `/s/{id}`) · "다시 입력"(결과 지우고 URL에서 `tab` 제거)
2. `CompatibilityResult`(props: `data`, `name1`, `name2`, `relationType`, `memberId`·`profileId1`·`profileId2`(프로필×2일 때만, 제출 시점 스냅샷), `streamingNarrative`, `narrativeLoading`) → `components/compatibility/` 탭 파일

   | 탭 (`?tab=`) | 내용 |
   |---|---|
   | 종합 `total` | 종합 점수(0~100)·라벨·설명·`key_traits` 칩·관계 유형 라벨·시간 미상 고지 |
   | 팔자 나란히 `pillars` | 일주 관계 3칸(`stem_combine`·`branch_combine`·`branch_clash`) · 같은 기둥 4쌍 관계(`pillar_relations`: 천간합·천간충·지지합·지지충·원진·형·해·파·삼합, PillarPairDiagram) · 삼합 완성(`samhap_completions`) |
   | 오행 보완 `element` | 오행 바×2(주오행·강약·용신) · OhengPairDiagram · 없는 오행(`element_complement.p1_lacks/p2_lacks`) · 보완 문장·점수 |
   | 신살 만남 `sinsal` | 공유/고유 신살 카드(`shared_sinsal`, `unique_sinsal_1/2`), 없으면 빈 상태 |
   | 영역별 `domain` | 레이더 + 영역 카드 4종(`domain_scores`: 연애·결혼·재물·직업 — 관계 유형별 `display_name`) 각각 `{score, level, narrative, pros[], cons[]}` + pros/cons 칩. 카드 순서는 프론트에서 고정(캐시 JSONB는 키 순서를 보존하지 않음) |
   | 오늘의 궁합 `daily` | `GET /compatibility/daily?member_id&p1&p2` → 오늘 일진·점수·레벨·headline. **프로필×2일 때만** 탭 노출(직접 입력·혼합·초대는 6탭, `?tab=daily`면 종합). 결과는 state에 캐시 |
   | AI 해석 `ai` | 결과 즉시 `POST /compatibility/narrative` 스트리밍 → 점진적으로 채워짐 (재분석 시 이전 스트림 abort) |

3. `sessionStorage`에 `kkachi_compat_input`, `kkachi_compat_names` 저장 → 우하단 `CompatibilityChat` FAB 표시

## 시나리오 5 — 궁합 상담 챗 (`/compatibility/chat`)

1. FAB 클릭 → 풀스크린 챗 (BottomNav 숨김), 헤더에 `name1 ♥ name2`
2. `sessionStorage["kkachi_compat_input"]` 없으면 "먼저 궁합 분석을 진행해주세요"
3. 질문 → `POST /compatibility/chat { ...input, messages }` → 스트리밍 (최근 10개 메시지)

---

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
| 2026-10-02 | 7탭으로 재구성(`components/compatibility/` 분할, 팔자 나란히·오행 보완·신살 만남·오늘의 궁합) + 홈 "오늘 나와 N점" 배지 표시 조건 수정 |

---

## 미결 사항 / 개선 검토

- [x] 영역별 궁합 카드 구조·시각화 추가 다듬기 (2026-10-02 탭 분리 + pros/cons 칩)
- [ ] 공유·고유 신살 카드 포맷/톤 (이미지 키움 시도는 롤백 이력)
- [x] 궁합 결과 공유 기능 (2026-09-28 공유 카드 `/s/{id}`)
- [ ] 언제가 좋을까 — 두 사람 타이밍 교집합 탭 (ROADMAP V2-2 보류, 별도 모듈로)
- [ ] 탭 전환마다 `listProfiles`·`getCompatInvite` 재호출 (`[searchParams]` 의존) — `p1`/`p2`/`invite` 값으로 의존성 좁히기
- [ ] 프로필 1개만 있을 때 인물 2 자동 직접 입력 강제
