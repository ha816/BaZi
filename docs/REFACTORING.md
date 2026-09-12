# 사주까치 리팩토링 가이드

CLAUDE.md의 *Anti-bloat rules* 가 **새 코드를 짤 때**의 룰이라면, 이 문서는 **이미 있는 코드를 정리할 때**의 룰이다. 짧고 체크리스트 위주. 망설일 때마다 다시 본다.

---

## 1. 언제 리팩토링하나 (트리거)

다음 중 하나라도 해당하면 리팩토링 후보:

- 비슷한 코드가 **3번째 등장**할 때 (2번까지는 그냥 둔다)
- 단일 파일 **LOC > 500** (백엔드) 또는 **> 400** (프론트엔드 컴포넌트)
- 한 모듈/컴포넌트가 **3개 이상 도메인**을 다루고 있을 때 (예: NatalTab이 팔자+오행+십신+운성+신살 다 담당)
- 같은 상수/타입이 **2곳 이상**에 정의돼있을 때
- 주석·문서가 코드와 어긋났을 때 (코드 또는 문서 둘 중 하나가 stale)
- 기능 추가 PR이 **부수적 정리**까지 끌어안아 리뷰가 어려워질 때 → 정리만 떼서 별도 PR

## 2. 언제 *하지 않나* (정지 신호)

- 한 번만 쓰는 helper 추출 — Anti-bloat 위반
- "나중에 필요할지도 모르니" 미리 추상화 — 가상 미래 금지
- 기능 추가 PR과 리팩토링 PR을 **같은 PR에 섞기** — 리뷰 불가
- 테스트가 없는 코드를 *먼저* 손대기 — characterization test부터
- 이름만 살짝 바꾸기 위해 50개 파일 건드리기 — 가치 대비 risk 평가

## 3. 단계 체크리스트 (모든 리팩토링 공통)

1. **현재 동작 고정** — 기존 테스트 그린 확인. 부족하면 characterization test 추가 후 커밋
2. **작은 단위로 쪼개기** — 한 커밋 ≤ ~200 LOC 변경 목표
3. **각 단계마다 커밋** — 빌드/테스트 그린일 때만
4. **public API/타입은 마지막에** — 내부 재배치 → 시그니처 변경 순서
5. **수직 검증** — 백엔드는 `uv run pytest -v`, 프론트는 `npm run dev` + 주요 페이지 클릭 + `npx tsc --noEmit`
6. **PR 사이즈** — 변경 LOC 목표 ≤ 400. 넘으면 무조건 분할

## 4. 사주까치 도메인 룰

이 프로젝트에 특화된 정리 원칙. **항상** 지킨다.

### 4-1. 단일 SoT (Source of Truth)
- 간지 enum·상수는 **백엔드 `src/kkachi/domain/ganji.py`** 또는 **프론트엔드 `frontend/src/lib/ganji.ts`** 에만 정의
- 탭/컴포넌트 안에 `STEM_*`, `BRANCH_*`, `SIPSIN_*` 같은 Record를 직접 박지 않는다 — 2곳 이상에서 쓰면 `lib/` 로 추출
- 오행 색상은 `lib/elementColors.ts`, 12지신 메타는 `lib/zodiac.ts`, 용어 사전은 `lib/glossary.ts`

### 4-2. 텍스트 해석은 백엔드에만
- 풀이/해석 텍스트는 **`src/kkachi/application/interpreter/*.py`** 에서만 생성
- 프론트엔드에는 분기(`if oheng === '火' && sipsin === '正官' ...`) 텍스트 매핑을 두지 않는다
- 시운·풍수·12지신 해석은 이미 백엔드로 이관됨 — 프론트는 표시만

### 4-3. 카드 UI 포맷
모든 분석 결과 카드는 NatalTab 포맷을 따른다:
- `slide-card` 래퍼
- `CollapsibleSectionHeader` (혹은 `SectionHeader`)
- divider
- **본문 시작에 인트로 `KkachiTip` 필수**
- 본문

자세한 시각 가이드는 `docs/frontend/screen_spec.md` 참고.

### 4-4. Hexagonal 경계 준수
- 도메인 dataclass (`src/kkachi/domain/`) 에서 외부 라이브러리(sajupy, sqlalchemy) import 금지
- Port (ABC) → Adapter (구현) 한 방향. Application 레이어가 Adapter를 직접 import 금지 (DI Container 경유)
- Controller (`adapter/inner/`) 는 thin — 검증/HTTP 변환만, 비즈니스 로직 금지

## 5. 현재 hot spot (2026-09 기준)

알면 우선순위 판단이 쉬워진다. 5월 표의 NatalTab(970→27)·fortune_service(462→97)·natal_adapter(447→192) 분할은 완료됨.

| 파일 | LOC | 문제 | 권장 액션 |
|------|-----|------|-----------|
| `src/kkachi/application/compatibility_service.py` | 1085 | 점수 계산 + 관계유형별 prose 사전 + 도메인 조언 + LLM 프롬프트 한 파일 | prose/조언 사전을 `util/compatibility_meta.py`로, 프롬프트 빌더 분리 |
| `src/kkachi/domain/ganji.py` | 653 | enum + 변환로직 + 지장간/한글 매핑 혼재 | 변환은 `application/util/`로 이동 |
| `frontend/src/components/CompatibilityResult.tsx` | 621 | 점수·라더·기둥비교·신살·narrative 5개 영역 한 컴포넌트 | `components/compatibility/` 하위 섹션 분리 (NatalTab 방식) |
| `frontend/src/types/analysis.ts` | 476 | 사주·궁합·운세·회원 타입 전부 한 파일 | 도메인별 파일 분리 검토 (import 경로 영향 큼, 낮은 우선순위) |
| `src/kkachi/application/report_builder.py` | 448 | 6개 섹션 포맷팅 | 단일 책임 보존 결정(5/24). LLM 파이프 확장 시 재고 |
| `frontend/src/components/tabs/ZodiacTab.tsx` | 417 | 십이지신·충합·연도별 궁합 3영역 | 섹션 분리 검토 |

## 6. PR 작성 규칙

- 제목: `refactor: <대상> <어떻게>` 예) `refactor: NatalTab을 섹션 단위로 분할`
- 본문에 **변경 LOC**, **테스트 결과**, **시각 회귀 확인 페이지** 명시
- 한 PR = 한 리팩토링 단계 (위 §3-2)
- 리팩토링과 기능 추가/버그 수정을 **섞지 않는다**

---

> 이 문서가 stale 해지지 않게 — 새 hot spot 발생 시 §5 표만 한 줄 갱신.
