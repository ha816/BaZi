"""캐릭터 그림 키(art_key) — 남성은 유형 키 그대로, 여성은 `_여` 여성판(2026-10-23). 유형 키(key)는 성별과 무관."""
import asyncio
from datetime import datetime

from kkachi.adapter.outer.natal_adapter import NatalAdapter
from kkachi.adapter.outer.postnatal_adapter import PostnatalAdapter
from kkachi.application.compatibility_service import CompatibilityService
from kkachi.application.kkachi_service import KkachiService, NatalService, PostnatalService
from kkachi.application.profile_service import _apply_art_key
from kkachi.application.saju_character import character_art_key
from kkachi.domain.user import Gender, User

_na, _pa = NatalAdapter(), PostnatalAdapter()
KK = KkachiService(natal_svc=NatalService(natal_port=_na), postnatal_svc=PostnatalService(natal_port=_na, postnatal_port=_pa))
BIRTH = datetime(1992, 11, 2, 8, 30)


def _character(gender: Gender) -> dict:
    user = User(name="", gender=gender, birth_dt=BIRTH)
    natal, post = KK.analyze(user, 2026)
    return asyncio.run(KK.interpret(natal, post, user=user)).natal.character


def test_art_key_is_type_key_for_male_and_female_variant_for_female():
    m, f = _character(Gender.MALE), _character(Gender.FEMALE)
    assert m["key"] == f["key"]
    assert m["art_key"] == m["key"] and f["art_key"] == f"{f['key']}_여"
    assert character_art_key("갑_강", False) == "갑_강_여"


def test_share_card_carries_art_key():
    user = User(name="", gender=Gender.FEMALE, birth_dt=BIRTH)
    natal, post = KK.analyze(user, 2026)
    card = KK.build_share_card(asyncio.run(KK.interpret(natal, post, user=user)), "영희")
    assert card["character"]["art_key"].endswith("_여") and "gender" not in card


def test_cached_profile_result_gets_art_key_from_profile_gender():
    result = {"natal": {"character": {"key": "임_약"}}}
    _apply_art_key(result, is_male=False)
    assert result["natal"]["character"]["art_key"] == "임_약_여"
    _apply_art_key(result, is_male=True)
    assert result["natal"]["character"]["art_key"] == "임_약"


def test_compat_roles_follow_each_persons_gender():
    cs = CompatibilityService(profile_port=None, compatibility_port=None, saju_service=KK, llm_port=None)
    u1 = User(name="철수", gender=Gender.MALE, birth_dt=datetime(1995, 6, 15, 12))
    u2 = User(name="영희", gender=Gender.FEMALE, birth_dt=BIRTH)
    roles = asyncio.run(cs.compute_direct(u1, u2, 2026, "lover"))["character"]["roles"]
    assert roles[0]["art_key"] == roles[0]["character_key"]
    assert roles[1]["art_key"] == f"{roles[1]['character_key']}_여"
