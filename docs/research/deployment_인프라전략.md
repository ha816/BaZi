# 사주까치 배포 인프라 전략

> 조사 기준일: 2025년 4월 / 기술 스택: FastAPI (Python 3.13) + Next.js 16 App Router + PostgreSQL 17

---

## 1. 프론트엔드 (Next.js 16 App Router) 호스팅 비교

### 1-1. Vercel (Hobby 플랜)

| 항목 | 상세 |
|------|------|
| 월 비용 | 무료 |
| 대역폭 | 100 GB/월 |
| 빌드 시간 | 6,000분/월 |
| 서버리스 함수 | 100 GB-hours 실행 시간 / 월 |
| 함수 개수 제한 | 배포당 12개 (App Router 기준 거의 문제 없음) |
| 함수 실행 제한 | Edge 런타임 최대 25초 응답 시작, 최대 300초 스트리밍 |
| 함수 크기 | 최대 250MB (압축 해제 기준) |
| 상업적 사용 | **불가** — 개인·비상업 프로젝트 전용 |

**상업적 사용 제한 핵심:**
Vercel Hobby 플랜 ToS 상 "개인 비상업적 사용"만 허용. 유료 서비스 운영, 광고 게재, 유급 직원이 코드에 기여한 프로젝트는 Pro 플랜($20/월) 업그레이드 필요.

**Next.js와의 궁합:** 최상. Vercel이 Next.js 개발사로 App Router, ISR, Edge Runtime을 네이티브 지원.

**단점:**
- 사주까치가 수익화할 경우 Pro 플랜 필요
- 콜드 스타트 존재 (Always On은 유료)

---

### 1-2. Cloudflare Pages + Workers (무료 플랜)

| 항목 | 상세 |
|------|------|
| 월 비용 | 무료 |
| 대역폭 | **무제한** |
| 빌드 | 500회/월 |
| Workers (서버리스) | 100,000 요청/일 |
| 콜드 스타트 | 거의 없음 (V8 Isolate 모델) |
| 상업적 사용 | 허용 |
| CDN 위치 | 300+ Edge PoP |

**Next.js 16 App Router 호환성:**
직접 Cloudflare Pages에 배포하는 것보다 **OpenNext + Cloudflare Workers** 조합을 Cloudflare가 공식 권장 (2025년 말 기준).
- `@cloudflare/next-on-pages` 패키지로 App Router 지원
- **중요 제약**: 전체 앱(API Routes + Server Components)이 단일 Worker 파일 **25MiB 이하**여야 함
- 일부 App Router 기능(커스텀 not-found 페이지 등) 미지원

**결론:**
- 수익화 예정이거나 트래픽이 많을 경우 Cloudflare가 유리
- 순수 Next.js + Vercel 편의성 대비 배포 복잡도 증가
- 25MiB Worker 크기 제한이 사주까치 앱에 문제될 수 있음 (sajupy 의존성 포함 백엔드와 분리 시 문제 없음)

---

### 프론트엔드 비교표

| 기준 | Vercel Hobby | Cloudflare Pages+Workers |
|------|-------------|--------------------------|
| 비용 | 무료 | 무료 |
| 대역폭 | 100 GB/월 | 무제한 |
| Next.js 궁합 | 최상 (네이티브) | 양호 (OpenNext 필요) |
| 상업적 사용 | 불가 | 가능 |
| 배포 편의성 | 매우 쉬움 | 설정 필요 |
| 콜드 스타트 | 있음 | 없음 |
| **추천** | 초기 MVP | 수익화 시점부터 |

---

## 2. 백엔드 (FastAPI) 호스팅 비교

### 2-1. Render (무료 플랜)

| 항목 | 상세 |
|------|------|
| 월 비용 | 무료 |
| RAM | 512 MB |
| CPU | 0.1 vCPU (공유) |
| 콜드 스타트 | 15분 비활성 후 슬립 → 재시작 30~60초 |
| 월 사용 시간 | ~750시간 |
| 퍼시스턴트 디스크 | 없음 (DB는 외부 사용 필요) |
| SSL | 무료 자동 |
| 배포 방법 | GitHub 연동 자동 감지 / Dockerfile |

**FastAPI 배포 방식:** `Dockerfile` 또는 `requirements.txt` + 빌드 명령어 자동 감지.
단, `uv` 기반 프로젝트는 별도 Dockerfile 작성 필요 (`uv export --format requirements-txt > requirements.txt`로 변환하거나 Dockerfile에서 `uv sync` 실행).

**단점:** 콜드 스타트가 사용자 경험에 악영향. 첫 요청 1분 대기는 치명적.
**해결책:** UptimeRobot 같은 무료 헬스체크 서비스로 15분마다 핑 → 슬립 방지 (Render ToS 회색지대이나 실용적으로 많이 사용됨).

---

### 2-2. Railway (Hobby 플랜)

| 항목 | 상세 |
|------|------|
| 월 비용 | **$5/월** (구독 + $5 사용 크레딧 포함) |
| 무료 플랜 | 없음 (신규 가입 시 30일 $5 트라이얼만 제공) |
| 배포 방법 | GitHub 자동 감지 / Dockerfile / One-click 템플릿 |
| 콜드 스타트 | 없음 (서비스 항상 실행) |
| 슬립 | 없음 |
| PostgreSQL | 별도 서비스로 추가 (사용량 기반 과금) |

**FastAPI 공식 가이드 제공:** Railway에 FastAPI 배포 4가지 방법 (GitHub, CLI, Dockerfile, 템플릿) 공식 문서화.
`uv` 기반이라면 Dockerfile 권장:
```dockerfile
FROM python:3.13-slim
RUN pip install uv
WORKDIR /app
COPY . .
RUN uv sync --frozen
CMD ["uv", "run", "uvicorn", "kkachi.fastapi:app", "--host", "0.0.0.0", "--port", "8000"]
```

**결론:** 완전 무료는 아니지만 $5/월에 안정적 운영. 사주까치 초기 유료화 전 현실적 선택.

---

### 2-3. Fly.io

| 항목 | 상세 |
|------|------|
| 월 비용 | 무료 없음 (2024년 10월 이후 무료 티어 폐지) |
| 신규 가입 | 2시간 또는 7일 트라이얼만 |
| 최소 비용 | shared-cpu-1x 256MB: ~$2/월 수준 (PAYG) |
| 배포 방법 | Dockerfile 필수 |
| 콜드 스타트 | scale-to-zero 설정 시 발생 |

**레거시 무료 플랜 사용자:** 2024년 10월 이전 가입자는 3개 shared VM 무료 유지.
**신규 사용자:** 무료 없음. PAYG이므로 소규모 앱은 월 $2~5 수준.

---

### 2-4. Koyeb (무료 플랜)

| 항목 | 상세 |
|------|------|
| 월 비용 | 무료 |
| 사양 | 1 vCPU (공유), 512 MB RAM |
| 대역폭 | 1 GB/월 |
| 슬립 | Scale-to-Zero 지원 (무료 티어 적용 여부 확인 필요) |
| 상업적 사용 | 허용 |
| 신용카드 | 불필요 |
| 지역 | Washington D.C. (1개 리전) |
| FastAPI 지원 | 공식 가이드 + One-click 배포 템플릿 |

**장점:** 무료지만 신용카드 없이 상업적 사용 가능. FastAPI 공식 지원.
**단점:** 1 GB/월 대역폭이 매우 낮음. 한국에서의 레이턴시 (D.C. 리전만).

---

### 백엔드 비교표

| 기준 | Render 무료 | Railway $5 | Fly.io PAYG | Koyeb 무료 |
|------|------------|-----------|------------|-----------|
| 비용 | 무료 | $5/월 | ~$2~5/월 | 무료 |
| 콜드 스타트 | 있음 (60초) | 없음 | 설정 의존 | 있을 수 있음 |
| RAM | 512 MB | 설정 의존 | 256MB~1GB | 512 MB |
| 대역폭 | 넉넉 | 넉넉 | PAYG | 1 GB/월 |
| 상업적 사용 | 가능 | 가능 | 가능 | 가능 |
| uv 지원 | Dockerfile | Dockerfile | Dockerfile | Dockerfile |
| **추천** | 개발/테스트 | 초기 운영 | 비용 최적화 | 완전 무료 테스트 |

---

## 3. PostgreSQL 무료 호스팅 비교

### 3-1. Neon (서버리스 Postgres)

| 항목 | 상세 |
|------|------|
| 월 비용 | 무료 |
| 스토리지 | 0.5 GB/브랜치, 프로젝트당 합계 5 GB |
| Compute | 100 CU-hour/프로젝트/월 (2025년 10월부터 상향) |
| 연결 수 | pgBouncer 포함 최대 10,000개 (풀링) |
| Scale-to-Zero | 5분 유휴 시 자동 슬립 |
| PITR | 6시간 |
| PostgreSQL 버전 | 16, 17 지원 |
| 슬립 후 복구 | 수초 내 (서버리스 특성상 빠름) |

**FastAPI + asyncpg 연결:**
```python
# DATABASE_URL 형식
postgresql+asyncpg://user:pass@ep-xxxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

**사주까치 규모 예상:**
- members: 수백 명 초기, 1행 ~100B
- profiles: 인당 평균 2개, ~200B/행
- analyses: 연간 캐시, ~10KB/행 (JSONB)
- daily_fortunes: 날씨+운세 JSONB, ~5KB/행
- compatibilities: ~5KB/행

초기 1,000명 기준 대략 100MB 이하. 0.5GB 한도 내 충분.

---

### 3-2. Supabase (무료 플랜)

| 항목 | 상세 |
|------|------|
| 월 비용 | 무료 |
| DB 용량 | 500 MB |
| 파일 스토리지 | 1 GB |
| 활성 프로젝트 | 2개 |
| **비활성 일시정지** | **7일 비활성 시 자동 정지** |
| 복구 | 재활성화 가능하나 수동 조작 필요 |

**치명적 단점:** 7일 비활성 시 프로젝트 정지. 운영 서비스에 부적합.
**우회 방법:** GitHub Actions로 매일 자동 핑 (공식 권장이 아니므로 위험 부담).

---

### 3-3. Render Postgres (무료 플랜)

| 항목 | 상세 |
|------|------|
| 월 비용 | 무료 |
| 스토리지 | 1 GB |
| **만료** | **생성 후 30일 후 자동 만료** |
| 만료 후 | 14일 유예 → 삭제 |
| 무료 DB 수 | 워크스페이스당 1개 |

**치명적 단점:** 30일 만료로 개발 테스트 전용. 운영 불가.

---

### 3-4. Railway Postgres

- Hobby 플랜($5/월) 에 포함되는 사용량 기반 과금
- 스토리지: $0.25/GB/월
- 별도 무료 Postgres 플랜 없음

---

### DB 비교표

| 기준 | Neon 무료 | Supabase 무료 | Render 무료 | Railway Hobby |
|------|----------|--------------|------------|--------------|
| 비용 | 무료 | 무료 | 무료 | $5/월 포함 |
| 스토리지 | 0.5 GB | 500 MB | 1 GB | 사용량 기반 |
| 만료 | 없음 | 7일 비활성 정지 | 30일 만료 | 없음 |
| 운영 적합 | **적합** | 부적합 | 개발 전용 | 적합 |
| PG 버전 | 16/17 | 15 | 15/16 | 15/16 |
| asyncpg | 지원 | 지원 | 지원 | 지원 |
| **추천** | **1순위** | 비추 | 비추 | Railway 쓸 때 |

---

## 4. 도메인 전략

### 4-1. 무료 도메인 옵션

| 옵션 | 형식 | 현황 | 적합성 |
|------|------|------|--------|
| is-a.dev | `kkachi.is-a.dev` | 활성 (개발자용 서브도메인) | 개발/테스트용 |
| eu.org | `kkachi.eu.org` | 활성 (비영리·개인) | 비영리 한정 |
| Freenom (.tk/.ml 등) | `kkachi.tk` | **서비스 중단** (Meta 소송으로 신규 등록 불가) | 불가 |
| Cloudflare Pages 기본 | `kkachi.pages.dev` | 활성 | 내부 테스트용 |
| Render 기본 | `kkachi.onrender.com` | 활성 | 내부 테스트용 |

**결론:** 진짜 무료 도메인은 브랜드 신뢰도 문제. MVP 이후에는 유료 도메인 필수.

---

### 4-2. 유료 도메인 후보 및 예상 비용

| 도메인 후보 | 연간 비용 (Namecheap 기준) | 비고 |
|------------|--------------------------|------|
| `sajukkachi.com` | $13~15/년 | 가능성 높음 (미등록 추정) |
| `kkachi.kr` | $22~30/년 | .kr TLD 해외 등록 시 비쌈 |
| `kkachi.co.kr` | $15~20/년 | 국내 가비아/후이즈 더 저렴 |
| `saju.com` | $100,000+ | 프리미엄 도메인 (구입 불가) |
| `sajukkachi.io` | $40~50/년 | .io 비쌈 |
| `sajukkachi.app` | $15~20/년 | Google 소유 TLD, 보안 좋음 |

**추천:** `sajukkachi.com` — 가격·브랜드·기억용이성 균형.
국내 타겟이면 `kkachi.co.kr` (가비아에서 $5~8/년 수준 가능).

---

### 4-3. Cloudflare DNS + 무료 SSL 설정

Cloudflare 무료 플랜에서 제공하는 것:
- **DNS 관리** (무료, 무제한)
- **Universal SSL** 인증서 자동 발급 (90일 자동 갱신)
- **CDN 캐싱** (정적 자산)
- **DDoS 보호** (기본)
- **Cloudflare Tunnel** (무료 — 로컬 서버 노출 가능)

**설정 단계:**
1. Cloudflare 가입 → 도메인 추가
2. Cloudflare가 기존 DNS 레코드 자동 스캔
3. 도메인 등록사에서 네임서버를 Cloudflare 네임서버로 변경
4. SSL/TLS → Full (strict) 모드 설정
5. DNS 레코드: A 레코드로 백엔드 IP, CNAME으로 Vercel/CF Pages 연결
6. 전파 완료 (보통 수분~수시간)

---

## 5. 최종 추천 스택

### 조합 A: 완전 무료 (MVP / 초기 테스트)

```
프론트엔드: Vercel Hobby 무료
백엔드:     Render 무료 (콜드 스타트 주의)
DB:         Neon 무료 (0.5 GB)
도메인:     없음 / *.vercel.app + *.onrender.com 기본 도메인
SSL:        각 플랫폼 자동 제공
```

| 월 비용 | $0 |
|---------|----|
| 한계 | Render 콜드 스타트 60초, Vercel 비상업적 제한, DB 0.5GB |
| 적합 상황 | 사이드 프로젝트, 비상업 MVP 검증 |

**주의:** Render 콜드 스타트 완화를 위해 UptimeRobot 무료 헬스체크 (https://uptimerobot.com) 설정 권장.

---

### 조합 B: 월 $8~13 현실 스택 (수익화 준비 단계)

```
프론트엔드: Vercel Pro OR Cloudflare Pages 무료
            → 수익화 시 Cloudflare Pages (무제한 대역폭, 상업적 허용)
백엔드:     Railway Hobby $5/월 (콜드 스타트 없음, 안정적)
DB:         Neon 무료 (0.5 GB) → 트래픽 증가 시 Neon Launch $19/월
도메인:     sajukkachi.com $13/년 ≈ $1/월
SSL:        Cloudflare 무료
```

| 월 비용 | $5~6/월 (초기) → $25~26/월 (성장 후) |
|---------|--------------------------------------|
| 장점 | 안정적 운영, 콜드 스타트 없음, 상업적 사용 가능 |
| 단점 | 소정의 비용 발생 |
| 적합 상황 | 유저 획득 시작, 수익화 추진 시 |

---

### 조합 C: 월 $0 상업 가능 스택 (비용 최소화 + 상업적 허용)

```
프론트엔드: Cloudflare Pages 무료 (상업적 허용, 무제한 대역폭)
            → OpenNext 어댑터 필요
백엔드:     Koyeb 무료 (1 vCPU, 512 MB, 상업적 허용)
            → 대역폭 1 GB/월 한계 주의
DB:         Neon 무료 (0.5 GB)
도메인:     sajukkachi.com $13/년 + Cloudflare DNS 무료
```

| 월 비용 | ~$1/월 (도메인만) |
|---------|------------------|
| 장점 | 상업적 허용, 대부분 무료 |
| 단점 | Koyeb 1 GB 대역폭 제한, Cloudflare Pages 배포 복잡도, 단일 D.C. 리전 |
| 적합 상황 | 상업적이지만 초기 트래픽이 극히 적을 때 |

---

### 최종 추천 요약

| 단계 | 추천 스택 | 월 비용 |
|------|----------|--------|
| **Day 0 – 개발 검증** | Vercel + Render + Neon | $0 |
| **Day 30 – 베타 운영** | Vercel + Railway + Neon | $5~6 |
| **Day 90 – 수익화** | CF Pages + Railway + Neon | $5~6 |
| **Day 180 – 성장** | CF Pages + Railway + Neon Launch | $24~26 |

**사주까치에 가장 적합한 이유:**

1. **DB: Neon이 압도적** — 만료 없음, PostgreSQL 17 지원, asyncpg 완벽 호환, 사주까치 초기 규모에 0.5GB 충분
2. **백엔드: Railway $5/월이 현실적** — 콜드 스타트가 없어야 점술 서비스 UX 유지 가능. 첫 요청이 1분 대기면 이탈률 급증
3. **프론트엔드: 초기 Vercel, 수익화 시 CF Pages** — Vercel이 Next.js 16 App Router를 가장 잘 지원하나 상업적 사용 제한으로 수익화 시점에 CF Pages + OpenNext로 이전

---

## 6. 배포 가이드 개요

### 6-1. Neon DB 연결 (FastAPI + asyncpg)

```bash
# Neon 대시보드에서 Connection String 복사
# 형식: postgresql+asyncpg://user:pass@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require
```

`src/bazi/adapter/outer/db/base.py`의 `DATABASE_URL` 환경변수로 주입:
```python
# 환경변수: DATABASE_URL
engine = create_async_engine(os.environ["DATABASE_URL"], pool_size=5, max_overflow=0)
```

Neon 서버리스 특성상 연결 풀 크기를 작게 유지 권장 (pool_size=2~5).

### 6-2. Railway FastAPI 배포

1. GitHub 저장소 연결
2. Dockerfile 작성 (루트 경로):
```dockerfile
FROM python:3.13-slim
RUN pip install uv
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY src/ src/
EXPOSE 8000
CMD ["uv", "run", "uvicorn", "kkachi.fastapi:app", "--host", "0.0.0.0", "--port", "8000"]
```
3. Railway 환경변수 설정: `DATABASE_URL`, `CORS_ORIGINS`
4. 자동 배포 활성화

### 6-3. Vercel Next.js 배포

1. GitHub 저장소 연결 → `frontend/` 서브디렉토리 루트 설정
2. 환경변수: `NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app`
3. 빌드 명령: `npm run build` (기본)

### 6-4. Cloudflare DNS + SSL

1. Cloudflare 가입 → 구매한 도메인 추가
2. 도메인 등록사에서 네임서버 교체
3. DNS 레코드:
   - `@` / `www` → CNAME → `cname.vercel-dns.com` (Vercel의 경우)
   - `api` → CNAME → Railway 앱 도메인
4. SSL/TLS → Full(strict) 선택
5. Edge Certificates → Universal SSL 활성화 확인

---

## 참고 출처

- [Vercel Hobby Plan Docs](https://vercel.com/docs/plans/hobby)
- [Vercel Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines)
- [Cloudflare Pages + Next.js Docs](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [OpenNext.js Cloudflare Adapter](https://opennext.js.org/cloudflare)
- [Railway FastAPI 배포 가이드](https://docs.railway.com/guides/fastapi)
- [Railway Pricing Plans](https://docs.railway.com/reference/pricing/plans)
- [Render Free Tier Docs](https://render.com/docs/free)
- [Fly.io Free Trial Docs](https://fly.io/docs/about/free-trial/)
- [Koyeb Free Tier](https://www.freetiers.com/directory/koyeb)
- [Neon Pricing & Plans](https://neon.com/docs/introduction/plans)
- [Supabase Pricing](https://supabase.com/pricing)
- [Cloudflare Free Plan Overview](https://www.cloudflare.com/plans/free/)
- [TLD-List .kr 도메인 가격](https://tld-list.com/tld/kr)
- [Free Next.js Hosting 2025 비교 — DEV Community](https://dev.to/joodi/free-nextjs-hosting-providers-in-2025-pros-and-cons-2a0e)
- [Next.js FastAPI 풀스택 배포 가이드 — Medium](https://medium.com/@zafarobad/ultimate-guide-to-deploying-next-js-d57ab72f6ba6)
- [Neon + FastAPI async 가이드](https://neon.com/guides/fastapi-async)
