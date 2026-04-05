from datetime import datetime

from kkachi.domain.ganji import Branch, SibiUnseong, Stem
from kkachi.domain.natal import Sinsal
from kkachi.domain.user import Gender, User
from kkachi.adapter.outer.natal_adapter import NatalAdapter

_analyzer = NatalAdapter()

USER_1990 = User(name="테스트", gender=Gender.MALE, birth_dt=datetime(1990, 10, 10, 14, 30))


def analyze(user):
    return _analyzer.analyze(user)


def test_yang_stem_forward():
    assert SibiUnseong.of(Stem.甲, Branch.亥) == SibiUnseong.長生
    assert SibiUnseong.of(Stem.甲, Branch.子) == SibiUnseong.沐浴
    assert SibiUnseong.of(Stem.甲, Branch.午) == SibiUnseong.死


def test_yin_stem_backward():
    assert SibiUnseong.of(Stem.乙, Branch.午) == SibiUnseong.長生
    assert SibiUnseong.of(Stem.乙, Branch.巳) == SibiUnseong.沐浴


def test_various_stems():
    assert SibiUnseong.of(Stem.丙, Branch.寅) == SibiUnseong.長生
    assert SibiUnseong.of(Stem.壬, Branch.申) == SibiUnseong.長生


def test_sibi_unseong_in_natal():
    info = analyze(USER_1990)
    assert len(info.sibi_unseong) == 4
    for pillar, unseong in info.sibi_unseong:
        assert isinstance(unseong, SibiUnseong)


def test_sinsal_get_samhap():
    results = Sinsal.get_samhap(Branch.申, [Branch.午, Branch.戌, Branch.申, Branch.未])
    samhap_results = [s for _, s in results if s in (Sinsal.驛馬, Sinsal.桃花, Sinsal.華蓋)]
    assert len(samhap_results) == 0

    results = Sinsal.get_samhap(Branch.申, [Branch.寅, Branch.戌, Branch.申, Branch.未])
    assert any(s == Sinsal.驛馬 for _, s in results)


def test_sinsal_get_guiin():
    results = Sinsal.get_guiin(Stem.甲, [Branch.丑, Branch.未, Branch.寅, Branch.卯])
    assert any(s == Sinsal.天乙貴人 for _, s in results)


def test_sinsal_in_natal():
    info = analyze(USER_1990)

    for branch_char, sinsal in info.sinsal:
        assert isinstance(sinsal, Sinsal)
