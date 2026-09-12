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

## 시나리오 4 — 결과 표시

1. `CompatibilityResult` 렌더 (`name1`, `name2`, `streamingNarrative`, `narrativeLoading` prop)
   - 종합 점수(0~100) + 라벨
   - 두 사주 비교: `pillar1_snapshot`/`pillar2_snapshot` (PillarPairDiagram, OhengPairDiagram)
   - 같은 기둥 4쌍의 관계(`pillar_relations`: 천간합·천간충·지지합·지지충·원진·형·해·파·삼합)
   - 삼합 완성(`samhap_completions`), 오행 보완(`element_complement`)
   - 공유/고유 신살, 핵심 특징(`key_traits`)
   - 영역별 점수 4종 (`domain_scores`: 연애·결혼·재물·직업 — 관계 유형별 라벨 치환) 각각 `{score, level, reason, display_name, pros[], cons[], narrative, advice}`
2. 결과 즉시 `POST /compatibility/narrative` 스트리밍 시작 → 종합해석이 점진적으로 채워짐 (재분석 시 이전 스트림 abort)
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

---

## 미결 사항 / 개선 검토

- [ ] 영역별 궁합 카드 구조·시각화 추가 다듬기
- [ ] 공유·고유 신살 카드 포맷/톤 (이미지 키움 시도는 롤백 이력)
- [ ] 궁합 결과 공유 기능 (URL 파라미터 or 이미지 캡처)
- [ ] 프로필 1개만 있을 때 인물 2 자동 직접 입력 강제
