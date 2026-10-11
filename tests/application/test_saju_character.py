from datetime import datetime
from pathlib import Path

from kkachi.adapter.outer.natal_adapter import NatalAdapter
from kkachi.application.saju_character import _TYPES, build_saju_character
from kkachi.domain.ganji import Stem
from kkachi.domain.user import Gender, User

_IMG_DIR = Path(__file__).parents[2] / "frontend/public/kkachi/saju_character"


def test_character_from_day_stem_and_strength():
    natal = NatalAdapter().analyze(User(name="", gender=Gender.MALE, birth_dt=datetime(1990, 10, 10, 14, 30)))
    c = build_saju_character(natal)  # 戊土 · 기운 77.1% 신강
    assert c["key"] == "무_강" and c["strong"] is True
    assert c["name"] == "우뚝 선 산" and c["title"] == "든든한 수호자" and c["job"] == "CEO"
    assert c["strength_pct"] == natal.strength_pct and len(c["jobs"]) == 3


def test_all_20_types_have_image():
    assert len(_TYPES) == 20
    for stem in Stem:
        for strong in (True, False):
            assert (stem.name, strong) in _TYPES
            assert (_IMG_DIR / f"{stem.korean}_{'강' if strong else '약'}.webp").exists()
