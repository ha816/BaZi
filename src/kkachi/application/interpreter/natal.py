from kkachi.domain.ganji import BRANCH_ANIMAL, Branch, branch_relation
from kkachi.application.util.util import year_to_ganji
from kkachi.domain.natal import NatalInfo


def pillar_summary(natal: NatalInfo) -> str:
    """오행 분포 기반 1문장 요약."""
    sorted_elements = sorted(natal.element_stats.items(), key=lambda x: x[1], reverse=True)
    if not sorted_elements or sorted_elements[0][1] == 0:
        return ""
    strongest, count = sorted_elements[0]
    missing = [o for o, c in natal.element_stats.items() if c == 0]
    summary = f"여덟 글자 중 {strongest.meaning}({strongest.name})의 기운이 {count}개로 가장 많아요."
    if missing:
        names = "·".join(o.meaning for o in missing)
        summary += f" {names}의 기운이 없어서, 이를 보완하는 운이 오면 좋아요."
    else:
        summary += " 다섯 기운이 모두 있어 균형 잡힌 구성이에요."
    return summary


def zodiac_relation(birth_branch: Branch, year: int) -> str:
    """태어난 해 지지와 분석 연도의 띠 관계를 한 문장으로 반환."""
    seun_branch = Branch.from_char(year_to_ganji(year)[1])
    kor = BRANCH_ANIMAL.get(seun_branch.name, seun_branch.name)
    label = f"{year}년 {kor}띠 해"
    rel = branch_relation(birth_branch.name, seun_branch.name)
    if rel == "나":
        return f"올해({label})와 같은 해예요. 본명년(本命年)으로 변화가 많은 해입니다."
    if rel == "충":
        return f"올해({label})와 충(衝)이 있어요. 예상치 못한 변화에 유연하게 대처하세요."
    if rel == "삼합":
        return f"올해({label})와 삼합이 맞아요. 좋은 기운이 따릅니다."
    return f"올해({label})와 특별한 충·합은 없어요. 꾸준히 나아가기 좋은 해예요."
