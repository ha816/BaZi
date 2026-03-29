# BaZi (사주팔자 분석기)

사주팔자(四柱八字)를 계산하고 오행(五行) 기반 종합 분석을 제공하는 Python 프로젝트.

## 사주 기본 개념

사주는 4개의 기둥(년주, 월주, 일주, 시주)으로 구성되며, 각 기둥은 **천간(天干, Stem)** + **지지(地支, Branch)** 두 글자의 조합이다.

- 천간 10개 × 지지 12개를 순서대로 짝지으면 **60갑자**(六十甲子)가 만들어진다.
- 4기둥 × 2글자 = 8글자 → 팔자(八字)

자세한 내용은 [docs/ganji_basics.md](docs/ganji_basics.md) 참조.

## 설치

```bash
uv sync
```

## 실행

### FastAPI 서버

```bash
uvicorn bazi.fastapi:app --reload --port 8000
```

- API 문서: http://localhost:8000/docs
- 분석 엔드포인트: `POST /saju/interpret`

### Streamlit UI

```bash
streamlit run src/bazi/streamlit.py --server.port 8501
```

## 테스트

```bash
uv run pytest
```

## 프로젝트 구조

```
src/bazi/
  domain/                  # 도메인 모델 (순수 비즈니스 로직)
    ganji.py               # Oheng, Stem, Branch, StemBranch, Pillar, Sipsin, SibiUnseong 등 간지 enum
    natal.py               # Saju, NatalInfo, PostnatalInfo, Sinsal, Samjae 등 분석 결과 모델
    interpretation.py      # Interpretation - 종합 해석 결과 dataclass
    user.py                # User, Gender
  application/             # 애플리케이션 서비스 & 유스케이스
    saju_service.py        # SajuService - analyze(선후천 분석) + interpret(종합 해석)
    port/                  # 포트 인터페이스 (의존성 역전)
      saju_port.py         # NatalPort, PostnatalPort, InterpreterPort
    interpreter/           # 영역별 텍스트 해석기
      personality.py       # 성격·기질 해석
      yongshin.py          # 용신 분석
      fortune.py           # 영역별 운세
      seun.py              # 세운(올해 운세)
      daeun.py             # 대운 흐름
      relationship.py      # 충·합 관계
      advice.py            # 종합 조언
    constant.py            # 해석용 상수 (DOMAIN_MAP, SAMJAE_MAP 등)
    util/                  # 유틸리티
  adapter/                 # 어댑터 (외부 시스템 연동)
    inner/                 # Driving adapter (API)
      saju_controller.py   # FastAPI 라우터
    outer/                 # Driven adapter (인프라)
      natal_adapter.py     # NatalAdapter, PostnatalAdapter - sajupy 연동
  container.py             # DI 컨테이너 (dependency-injector)
  fastapi.py               # FastAPI 앱 설정
  streamlit.py             # Streamlit UI
tests/                     # 테스트
docs/                      # 간지 기초 문서
```

## 아키텍처

헥사고날 아키텍처(Ports & Adapters) 기반:

- **Domain**: 순수 도메인 모델. 외부 의존 없음.
- **Application**: 포트 인터페이스 정의 + 서비스 오케스트레이션 + 텍스트 해석.
- **Adapter**: sajupy 라이브러리 연동(outer), FastAPI 엔드포인트(inner).
