from datetime import datetime
from pathlib import Path

from kkachi.adapter.outer.natal_adapter import NatalAdapter
from kkachi.application.saju_character import _TYPES, build_saju_character
from kkachi.domain.ganji import Stem
from kkachi.domain.user import Gender, User

_IMG_DIR = Path(__file__).parents[2] / "frontend/public/kkachi/saju_character"
_SPEC = Path(__file__).parents[2] / "specs/analysis/character.md"


def test_character_from_day_stem_and_strength():
    natal = NatalAdapter().analyze(User(name="", gender=Gender.MALE, birth_dt=datetime(1990, 10, 10, 14, 30)))
    c = build_saju_character(natal)  # 戊土 · 기운 77.1% 신강
    assert c["key"] == "무_강" and c["strong"] is True
    assert c["name"] == "우뚝 선 산" and c["title"] == "든든한 수호자" and c["job"] == "CEO"
    assert c["strength_pct"] == natal.strength_pct and c["jobs"] == ["경영자", "공무원"]
    assert len(c["jobs_avoid"]) == 3 and not set(c["jobs"]) & set(c["jobs_avoid"])


def test_all_20_types_have_image():
    assert len(_TYPES) == 20
    for stem in Stem:
        for strong in (True, False):
            assert (stem.name, strong) in _TYPES
            assert (_IMG_DIR / f"{stem.korean}_{'강' if strong else '약'}.webp").exists()


def test_spec_table_matches_types():
    """specs/analysis/character.md §3 표 = _TYPES — 유형명·한 줄·선호/비선호·대표 직업·캐릭터가 글자까지 같다"""
    rows = {}
    for line in _SPEC.read_text().splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) == 10 and cells[1].startswith("`") and "_" in cells[1]:
            rows[cells[1].strip("`")] = cells
    assert len(rows) == 20
    for stem in Stem:
        for strong in (True, False):
            name, title, line, job, jobs, avoid = _TYPES[(stem.name, strong)]
            c = rows[f"{stem.korean}_{'강' if strong else '약'}"]
            assert c[4:] == [title, line, ", ".join(jobs), ", ".join(avoid), job, name], c[1]
