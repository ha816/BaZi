# 사주 분석 시나리오

## 관련 페이지 / API

| 경로 | 역할 |
|------|------|
| `/analysis` | 무료 기초 분석 (팔자·오행·십이지신) |
| `/analysis/deep` | 심층(프리미엄) 분석 — 로그인 필수 |
| `POST /saju/basic` | 무료 분석 API |
| `POST /saju/interpret` | 심층 분석 API |

---

## 시나리오 1 — 기초 분석 (비로그인 가능)

### 1-A 직접 입력 탭

1. `/analysis` 진입 → "프로필 직접 입력하기" 탭 기본 선택
2. `AnalysisForm`에 이름 · 성별 · 생년월일 · 태어난 시간 입력
   - 도시/경도는 `ipapi.co` IP 위치 감지로 자동 주입 (UI 미노출)
   - 태어난 시간 모를 때: 정오(12:00) 처리
3. "분석 시작" 클릭 → `POST /saju/basic` 호출
4. 성공 시 `FreeResultSlides` 렌더
   - `sessionStorage["kkachi_analysis_input"]`, `["kkachi_analysis_name"]` 저장 (심층 분석 이어서 사용)

### 1-B 저장된 프로필 탭 (로그인 시)

1. `localStorage["kkachi_member_id"]` 있으면 프로필 목록 자동 로드
2. "저장된 프로필 불러오기" 탭 → 드롭다운 프로필 선택
3. 분석 연도 선택 (기본: 올해)
4. "분석 시작" 클릭 → `POST /saju/basic` 호출
5. 성공 시 `FreeResultSlides` 렌더

### 1-C 비로그인 + 프로필 없을 때

- "저장된 프로필 불러오기" 탭: 빈 상태 + `/profile` 또는 `/join` 링크 안내

---

## 시나리오 2 — 심층 분석 (로그인 필수)

1. `FreeResultSlides` 하단 블러 CTA → "심층분석 시작하기" 클릭
2. `localStorage["kkachi_member_id"]` 없으면 → `/join` redirect
3. `sessionStorage["kkachi_analysis_input"]` 없으면 → `/analysis` redirect
4. `/analysis/deep` 진입 → sessionStorage 입력값으로 `POST /saju/interpret` 호출
5. 성공 시 `ResultSlides` 렌더 (9개 탭)

---

## 시나리오 3 — 심층 분석 결과 탭 구성

| 탭 | 컴포넌트 | 내용 |
|----|----------|------|
| 사주팔자 | `NatalTab` | 일간·오행·강약·용신·십신·십이운성·신살 |
| 성격분석 | `PersonalityTab` | 성격·강점·약점 |
| 올해운세 | `FortuneTab` | 영역별 점수·운세 |
| 대운흐름 | `DaeunTab` | 대운·세운 다이어그램 |
| 인간관계 | `RelationshipTab` | 관계 패턴 |
| 종합조언 | `AdviceTab` | 종합 가이드 |
| 12지신 | `ZodiacTab` | 띠 관계·삼재 |

---

## 데이터 흐름

```
POST /saju/basic
  Request: { birth_dt, gender, city, longitude?, year }
  Response: { pillars, day_stem, element_stats, my_element, year_branch, zodiac_relation }

POST /saju/interpret
  Request: { birth_dt, gender, analysis_year, city }
  Response: { natal: NatalResult, postnatal: PostnatalResult }
```

---

## 구현 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-04-08 | 기초 분석·심층 분석 페이지 분리, FreeResultSlides 블러 CTA 추가 |
| 2026-04-08 | 분석 탭 항상 표시 (프로필 유무 무관), 프로필 없을 때 빈 상태 안내 |
| 2026-04-08 | "저장된 프로필 불러오기" / "프로필 직접 입력하기" 풀-width 탭으로 개편 |

---

## 미결 사항 / 개선 검토

- [ ] 심층 분석 결과 캐시 (동일 입력 재분석 방지)
- [ ] 분석 연도 변경 시 결과 자동 갱신
- [ ] 프로필 저장 후 즉시 심층 분석으로 이어지는 원클릭 플로우
