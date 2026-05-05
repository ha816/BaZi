from datetime import datetime

from kkachi.domain.ganji import Branch, Stem


def year_to_ganji(year: int) -> str:
    """연도를 간지로 변환한다. (예: 2026 → '丙午')"""
    stem = Stem.by_order((year - 4) % 10)
    branch = Branch.by_order((year - 4) % 12)
    return stem.name + branch.name


def josa(word: str, with_jong: str, without_jong: str) -> str:
    """한국어 조사 선택 — 마지막 음절 받침 유무에 따라 with_jong / without_jong 반환."""
    if not word:
        return without_jong
    code = ord(word[-1])
    has = 0xAC00 <= code <= 0xD7A3 and (code - 0xAC00) % 28 != 0
    return with_jong if has else without_jong


def parse_term_time(term_time: float) -> datetime:
    """sajupy의 term_time(YYYYMMDDHHMM float)을 datetime으로 변환한다."""
    s = str(int(float(str(term_time))))
    return datetime(int(s[0:4]), int(s[4:6]), int(s[6:8]), int(s[8:10]), int(s[10:12]))