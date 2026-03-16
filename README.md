# BaZi (사주팔자 분석기)

사주팔자(四柱八字)를 계산하고 오행(五行) 기반 기초 분석을 제공하는 Python 프로젝트.

## 사주 기본 개념

사주는 4개의 기둥(년주, 월주, 일주, 시주)으로 구성되며, 각 기둥은 **천간(天干, stem)** + **지지(地支, branch)** 두 글자의 조합이다.

- 천간 10개 × 지지 12개를 순서대로 짝지으면 **60갑자**(六十甲子)가 만들어진다.
- 4기둥 × 2글자 = 8글자 → 팔자(八字)

자세한 내용은 [docs/ganji_basics.md](docs/ganji_basics.md) 참조.

## 설치

```bash
uv sync
```

## 사용법

```python
from saju import SajuAnalyzer

analyzer = SajuAnalyzer()

# 생년월일시로 사주 계산 + 오행 분석
result = analyzer.from_birthday(1990, 10, 10, 14, 30, city="Seoul")

# 간지를 직접 입력하여 오행 분석
result = analyzer.analyze(["庚午", "丙戌", "戊申", "己未"])

print(result.my_main_element)   # 나의 주 오행
print(result.element_stats)     # 오행별 개수
print(result.base_personality)  # 기본 성격
```

## 테스트

```bash
uv run pytest
```

## 프로젝트 구조

```
src/saju/          # 핵심 모듈
  analyzer.py      # SajuAnalyzer - 오행 분석기
src/common/
  constants.py     # 오행 매핑, 해석 데이터
tests/             # 테스트
docs/              # 간지 기초 문서
```