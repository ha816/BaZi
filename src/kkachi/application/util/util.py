from datetime import datetime

from kkachi.domain.ganji import BRANCHES_ORDER, Branch, BranchClash, BranchCombine, BranchWonjin, SAMHAP_GROUPS, Stem


def year_to_ganji(year: int) -> str:
    """연도를 간지로 변환한다. (예: 2026 → '丙午')"""
    stem = Stem.by_order((year - 4) % 10)
    branch = Branch.by_order((year - 4) % 12)
    return stem.name + branch.name


def year_to_branch_char(year: int) -> str:
    """연도에 해당하는 지지 문자(한자)를 반환한다. (예: 2026 → '午')"""
    return BRANCHES_ORDER[(year - 4 + 1200) % 12]


def branch_relation(a: str, b: str) -> str:
    """두 지지 문자(한자)의 관계 타입을 반환한다: 나/삼합/육합/충/원진/보통."""
    if a == b:
        return "나"
    if any(a in group and b in group for group, _ in SAMHAP_GROUPS):
        return "삼합"
    if any({p.first.name, p.second.name} == {a, b} for p in BranchCombine):
        return "육합"
    if any({p.first.name, p.second.name} == {a, b} for p in BranchClash):
        return "충"
    if any({p.first.name, p.second.name} == {a, b} for p in BranchWonjin):
        return "원진"
    return "보통"


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