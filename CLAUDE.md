# BaZi 프로젝트 가이드

## 프로젝트 개요

사주팔자(四柱八字) 계산 및 오행 기반 종합 분석 웹 서비스.

- **백엔드**: Python 3.13 + FastAPI + sajupy
- **프론트엔드**: Next.js 16 + TypeScript + Tailwind CSS
- **아키텍처**: Hexagonal Architecture (Port & Adapter)
- **패키지 관리**: uv (Python), npm (Node)

## 실행

```bash
# 백엔드
uv run uvicorn bazi.fastapi:app --reload --port 8000

# 프론트엔드
cd frontend && npm run dev

# 테스트
uv run pytest
uv run pytest -v
```

## 코드 구조

```
src/bazi/
├── fastapi.py               # FastAPI 앱 + CORS + 라우터 등록
├── container.py             # DI Container (dependency-injector Singleton)
├── domain/
│   ├── ganji.py             # Oheng, Stem, Branch, Sipsin, SibiUnseong enum
│   ├── natal.py             # Saju, NatalInfo, PostnatalInfo, DaeunPeriod dataclass
│   ├── user.py              # User dataclass, Gender enum
│   └── interpretation.py    # Interpretation dataclass (최종 결과)
├── application/
│   ├── saju_service.py      # SajuService: analyze() + interpret() 오케스트레이션
│   ├── port/saju_port.py    # NatalPort, PostnatalPort, InterpreterPort ABC
│   ├── interpreter/         # 9개 텍스트 해석기 클래스
│   └── util/util.py         # year_to_ganji 등 유틸
└── adapter/
    ├── inner/saju_controller.py   # FastAPI 라우터 POST /saju/interpret
    └── outer/natal_adapter.py     # NatalAdapter + PostnatalAdapter (sajupy 연동)

frontend/src/
├── app/page.tsx             # 메인 페이지
├── components/              # 18개 React 컴포넌트
├── lib/                     # api.ts, elementColors.ts, glossary.ts
└── types/analysis.ts        # TypeScript 타입 정의
```

## 아키텍처 원칙

- **Hexagonal Architecture**: 도메인 로직은 외부 의존성과 분리
- **Port & Adapter**: 추상 인터페이스(Port) → 구현체(Adapter)
- **DI**: dependency-injector Singleton, @inject로 주입
- **dataclass 직렬화**: schema 레이어 없이 `asdict()`로 직접 JSON 변환

## 데이터 흐름

```
POST /saju/interpret
  → SajuService.analyze()
      → NatalAdapter → NatalInfo (간지, 오행, 강약, 용신, 십신, 십이운성, 신살)
      → PostnatalAdapter → PostnatalInfo (세운, 대운, 삼재, 충합, 영역점수)
  → SajuService.interpret()
      → 9개 Interpreter → Interpretation (최종 결과)
  → asdict() → JSON 응답
```

## Always / Never

**ALWAYS:**
- `uv run`으로 Python 실행 (pip, python 직접 실행 금지)
- 테스트를 먼저 실행해서 기존 동작 확인 후 수정
- 3개 이상 파일 변경 시 Plan 먼저

**NEVER:**
- `git push --force`
- `rm -rf`
- `.env` 파일 수정 또는 외부 전송
- main 브랜치에 직접 push

## Anti-bloat rules

**IMPORTANT: YOU MUST follow these rules:**
- 단일 사용 helper/util 함수 생성 금지 — 3번 이상 쓰일 때만 추출
- 래퍼, 팩토리, 불필요한 인디렉션 추가 금지
- 현재 태스크에 필요한 최소 복잡도만 사용
- 비슷한 코드 3줄 > 성급한 추상화
- 새 파일 생성보다 기존 파일 수정 우선

## 제품 방향 — "와, 진짜 내 얘기네?" 만들기

단순 운세 표시를 넘어 사용자가 공감하게 만드는 3가지 핵심 방향.

### ① 하이브리드 해석 엔진 (Rule + LLM)
현재 Interpreter들의 출력(Raw Data)을 LLM 컨텍스트로 주입해 자연어 품질을 높인다.

전략:
> "이 사용자는 火가 4개인 신강 사주야. 올해는 水운이 들어와서 충(衝)이 발생해.
>  이 데이터를 바탕으로 30대 직장인에게 조언하듯 부드럽게 설명해줘"

- Rule 엔진(현재) → 구조화된 데이터 생성
- LLM → 데이터를 받아 개인화된 자연어로 변환
- LLM은 해석 생성기가 아닌 **언어 변환기** 역할

### ② 점수 근거 시각화 (Domain Scores)
domain_scores의 점수가 **왜** 나왔는지 근거를 툴팁으로 제공 → 신뢰도 급상승.

예시:
> 재물운 80점인 이유 → 대운에서 정재(正財)가 들어오고 일지와 합(合)이 되기 때문

- 각 도메인 점수에 `reason: str` 필드 추가
- 프론트엔드 툴팁/아코디언으로 노출

### ③ 피드백 루프 (Feedback Loop)
해석 하단 "이 해석이 잘 맞나요?" 버튼 → RDB에 누적 → 해석기 품질 튜닝.

- 어떤 Interpreter가 만족도 높은지 측정
- 낮은 해석기부터 우선 개선
- 장기적으로 LLM fine-tuning 데이터로 활용

## 코딩 컨벤션

- `__init__.py`는 비워두거나 re-export만
- 모듈 최상단 docstring 없음 (클래스 docstring만)
- 섹션 구분 주석 (`# ──`) 사용 금지
- 메서드명은 `_get_*` 패턴
- private `_` prefix는 모듈 내부용에만
- async 우선 (FastAPI 파이프라인 전체)
- 상수는 사용처 가까이 위치 (constant.py 분리 안 함)

## API 스펙

```
POST /saju/interpret
Request:  { birth_dt: datetime, gender: "M"|"F", analysis_year: int, city: str }
Response: asdict(Interpretation)
```

## 테스트

```
tests/
├── adapter/
│   ├── test_analyzer.py      # 선천 분석 (강약, 용신, 십신)
│   ├── test_fortune.py       # 영역별 운세
│   └── test_sibi_unseong.py  # 십이운성
└── application/
    └── test_interpret.py     # 종합 해석 통합 테스트
```
