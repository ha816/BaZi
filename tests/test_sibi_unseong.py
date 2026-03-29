from bazi.domain.ganji import Branch, SibiUnseong, Stem
from bazi.domain.natal import Sinsal
from bazi.domain.natal import Saju
from bazi.application.natal_service import NatalAnalyzer

analyze = NatalAnalyzer()


# ── 십이운성 단위 테스트 ──


def test_yang_stem_forward():
    """양간(甲)은 순행: 甲의 長生=亥, 沐浴=子"""
    assert SibiUnseong.of(Stem.甲, Branch.亥) == SibiUnseong.長生
    assert SibiUnseong.of(Stem.甲, Branch.子) == SibiUnseong.沐浴
    assert SibiUnseong.of(Stem.甲, Branch.寅) == SibiUnseong.建祿
    assert SibiUnseong.of(Stem.甲, Branch.卯) == SibiUnseong.帝旺


def test_yin_stem_backward():
    """음간(乙)은 역행: 乙의 長生=午, 沐浴=巳"""
    assert SibiUnseong.of(Stem.乙, Branch.午) == SibiUnseong.長生
    assert SibiUnseong.of(Stem.乙, Branch.巳) == SibiUnseong.沐浴


def test_various_stems():
    """다양한 천간 테스트"""
    assert SibiUnseong.of(Stem.丙, Branch.寅) == SibiUnseong.長生
    assert SibiUnseong.of(Stem.庚, Branch.巳) == SibiUnseong.長生
    assert SibiUnseong.of(Stem.壬, Branch.申) == SibiUnseong.長生


def test_sibi_unseong_in_natal():
    """선천 분석에 십이운성이 포함되는지"""
    info = analyze(Saju(1990, 10, 10, 14, 30))

    assert len(info.sibi_unseong) == 4
    # 일간=戊, 戊의 長生=寅
    for pillar, unseong in info.sibi_unseong:
        assert isinstance(unseong, SibiUnseong)


# ── 신살 단위 테스트 ──


def test_sinsal_find_all():
    """일지 기준 신살 찾기"""
    from bazi.domain.ganji import Stem

    # 申은 申子辰 그룹: 역마=寅, 도화=酉, 화개=辰
    results = Sinsal.find_all(Stem.戊, Branch.申, [Branch.午, Branch.戌, Branch.申, Branch.未])
    # 삼합 기반 신살은 없지만, 천을귀인/문창귀인/백호살이 있을 수 있음
    samhap_results = [s for _, s in results if s in (Sinsal.驛馬, Sinsal.桃花, Sinsal.華蓋)]
    assert len(samhap_results) == 0

    # 寅이 포함되면 역마살 감지
    results = Sinsal.find_all(Stem.戊, Branch.申, [Branch.寅, Branch.戌, Branch.申, Branch.未])
    assert any(s == Sinsal.驛馬 for _, s in results)

    # 천을귀인 테스트: 甲일간은 丑, 未에서 천을귀인
    results = Sinsal.find_all(Stem.甲, Branch.子, [Branch.丑, Branch.未, Branch.寅, Branch.卯])
    assert any(s == Sinsal.天乙貴人 for _, s in results)


def test_sinsal_in_natal():
    """선천 분석에 신살이 포함되는지"""
    info = analyze(Saju(1990, 10, 10, 14, 30))

    for branch_char, sinsal in info.sinsal:
        assert isinstance(sinsal, Sinsal)
