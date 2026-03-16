"""도메인 유틸리티 - 간지 변환, 날짜 파싱 등."""

from datetime import datetime

from bazi.domain.ganji import Branch, Stem


def year_to_ganji(year: int) -> str:
    """연도를 간지로 변환한다. (예: 2026 → '丙午')"""
    stem = Stem.by_order((year - 4) % 10)
    branch = Branch.by_order((year - 4) % 12)
    return stem.name + branch.name


def parse_term_time(term_time: float) -> datetime:
    """sajupy의 term_time(YYYYMMDDHHMM float)을 datetime으로 변환한다."""
    s = str(int(float(str(term_time))))
    return datetime(int(s[0:4]), int(s[4:6]), int(s[6:8]), int(s[8:10]), int(s[10:12]))
