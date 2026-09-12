# 사주까치 (BaZi)

사주팔자(四柱八字)를 계산하고 오행(五行) 기반 종합 해석·시운(時運)·궁합·손금·풍수를 제공하는 웹 서비스.

> 까치가 울면 반가운 소식이 온다 — 사주까치가 오늘의 기운을 가장 먼저 전해드립니다.

- **백엔드**: Python 3.13 · FastAPI · [sajupy](https://pypi.org/project/sajupy/) · SQLAlchemy(asyncpg) · Alembic · dependency-injector
- **프론트엔드**: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4
- **LLM**: Ollama 로컬 모델 (기본 `qwen2.5:32b`) — AI 풀이·상담 챗·궁합 종합해석 스트리밍
- **MCP**: FastMCP 서버를 `/mcp`에 마운트 (사주 컨텍스트·연간 운세·날씨 오행 도구 3종)
- **아키텍처**: Hexagonal (Port & Adapter)

개발 규칙·구조·API 상세는 [CLAUDE.md](CLAUDE.md), 리팩토링 규칙은 [docs/REFACTORING.md](docs/REFACTORING.md), 화면 명세는 [docs/frontend/screen_spec.md](docs/frontend/screen_spec.md) 참고.

## 빠른 시작

### 1. 사전 준비

| 항목 | 비고 |
|------|------|
| Python 3.13 + [uv](https://docs.astral.sh/uv/) | `pip`·`python` 직접 실행 금지, 항상 `uv run` |
| Node.js 20+ + npm | 프론트엔드 |
| Docker (Colima 또는 OrbStack) | 로컬 PostgreSQL 17 |
| Ollama (선택) | 없으면 AI 풀이·챗 탭만 비활성, 나머지 기능은 정상 동작 |

### 2. 백엔드 설정

```bash
uv sync

# 설정 파일 — DB URL, Toss 시크릿 키 (git에 커밋됨, 실제 키는 로컬에서만 채움)
#   src/kkachi/resource/local.toml
#     [db]   url = "postgresql+asyncpg://bazi:bazi@localhost:5432/bazi"
#     [toss] secret_key = "..."

# 손금 분석용 MediaPipe 모델 (약 7.8MB, git 미추적 — 최초 1회 다운로드)
curl -sL https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task \
  -o src/kkachi/resource/hand_landmarker.task
```

### 3. 실행

```bash
# DB
docker compose -f docker/docker-compose.yml up -d
uv run alembic upgrade head

# 백엔드 — 반드시 저장소 루트에서 실행 (local.toml을 상대경로로 읽음)
uv run uvicorn kkachi.fastapi:app --reload --port 8000
#   Swagger: http://localhost:8000/docs

# 프론트엔드
cd frontend && npm install && npm run dev
#   http://localhost:3000
```

### 4. 환경변수

| 변수 | 기본값 | 용도 |
|------|--------|------|
| `KKACHI_CORS_ORIGINS` | `http://localhost:3000` | 허용 origin (콤마 구분) |
| `KKACHI_CORS_ORIGIN_REGEX` | 없음 | 허용 origin 정규식 |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama 주소 |
| `OLLAMA_MODEL` | `qwen2.5:32b` | Ollama 모델명 |
| `NEXT_PUBLIC_API_URL` (frontend) | `http://localhost:8000` | 프론트가 호출할 API 주소 (`frontend/.env.local`) |

### 5. 테스트

```bash
uv run pytest           # 백엔드 (55 tests)
cd frontend && npx tsc --noEmit   # 프론트 타입 체크
```

## 주요 기능

| 기능 | 화면 | API |
|------|------|-----|
| 사주 종합 해석 (만세력·용신·삼재·시운·십이지신·풍수·AI 풀이) | `/analysis` | `POST /kkachi/interpret`, `POST /members/{id}/profiles/{pid}/analyze` |
| 까치 상담 챗 (LLM 스트리밍) | `/chat` | `POST /kkachi/chat` |
| 궁합 (연인·친구·가족 관계 유형, AI 종합해석·챗) | `/compatibility`, `/compatibility/chat` | `POST /compatibility`, `/compatibility/direct`, `/narrative`, `/chat` |
| 시운(時運) — 오늘·내일·주간 일진 + 날씨 오행 | `/siun`, `/` | `GET /members/{id}/profiles/{pid}/daily`, `/forecast` |
| 날씨 오행 (Open-Meteo) | `/weather` | `GET /weather` |
| 손금 (MediaPipe + OpenCV) | `/palmistry` | `POST /palmistry/analyze` |
| 회원·프로필 (이메일 식별, 최대 10 프로필) | `/join`, `/profile`, `/my` | `/members`, `/members/{id}/profiles` |
| 해석 피드백 👍/👎 + 관리자 요약 | 결과 하단, `/admin/feedback` | `POST .../feedback`, `GET /admin/feedback/summary` |
| 결제 (Toss) — 백엔드만 존재, 프론트 게이트는 제거됨 | — | `POST /payments/prepare`, `/confirm` |

## 프로젝트 구조

```
BaZi/
├── alembic/                 # DB 마이그레이션
├── docker/docker-compose.yml
├── docs/                    # REFACTORING.md, frontend/screen_spec.md, research/
├── src/kkachi/
│   ├── fastapi.py           # 앱 진입점 — 라우터 등록, CORS, MCP 마운트, local.toml 로드
│   ├── container.py         # DI 컨테이너
│   ├── resource/            # local.toml, hand_landmarker.task
│   ├── domain/              # 순수 dataclass·enum (ganji, natal, interpretation, fortune, compatibility …)
│   ├── application/
│   │   ├── *_service.py     # KkachiService, ProfileService, FortuneService, CompatibilityService …
│   │   ├── fortune_rules.py # 일진 점수 룰 (compute_fortune)
│   │   ├── report_builder.py# LLM 프롬프트용 마크다운 리포트
│   │   ├── port/            # ABC 포트
│   │   ├── interpreter/     # 13개 텍스트 해석기
│   │   ├── use_case/        # MCP 도구용 유스케이스
│   │   └── util/            # 간지 유틸·십신/충합/십이지신 메타
│   └── adapter/
│       ├── inner/           # FastAPI 컨트롤러 8개 + mcp_server.py
│       └── outer/           # sajupy(natal/postnatal), Open-Meteo, Ollama, DB repo
├── frontend/src/
│   ├── app/                 # 페이지 13개
│   ├── components/          # 공통 컴포넌트 + tabs/ (결과 탭) + tabs/natal/ (만세력 섹션)
│   ├── lib/                 # api.ts, ganji.ts, elementColors.ts, zodiac.ts, glossary.ts, relations.ts, constants.ts, location.ts
│   └── types/analysis.ts
└── tests/                   # adapter/, application/
```

파일 단위 상세 트리와 API 스펙은 [CLAUDE.md](CLAUDE.md)에 있다.
