from kkachi.application.util.zodiac_meta import (
    BRANCH_ORDER,
    relation_of,
    samhap_of,
    zodiac_info,
)
from kkachi.domain.ganji import Pillar
from kkachi.domain.interpretation import (
    PillarPair,
    PillarZodiac,
    ZodiacRelation,
    ZodiacResult,
)
from kkachi.domain.natal import NatalInfo


_PILLAR_ROLES: list[dict[str, str]] = [
    {"label": "년주(年柱)", "role": "사회적 자아", "desc": "남들이 보는 나의 대외 이미지, 사회적 첫인상"},
    {"label": "월주(月柱)", "role": "직장·부모 관계", "desc": "일과 직장, 부모 및 윗사람과의 에너지 흐름"},
    {"label": "일주(日柱)", "role": "본래 자아", "desc": "진짜 나의 내면, 배우자와의 인연 에너지"},
    {"label": "시주(時柱)", "role": "자녀·미래", "desc": "자녀 인연과 노후·미래를 향한 에너지"},
]


_RELATION_PRIORITY: dict[str, int] = {"삼합": 0, "육합": 1, "충": 2, "원진": 3}


class ZodiacInterpreter:
    """띠(地支) 기반 분석 — 12지 관계·4기둥 지지·삼합 등."""

    def __call__(self, natal: NatalInfo, name: str = "") -> ZodiacResult:
        year_branch = natal.saju.pillars[Pillar.年柱].branch.name
        pillar_branches = [sb.branch.name for sb in natal.saju.pillars.values()]

        year_info = zodiac_info(year_branch)

        relations = [
            ZodiacRelation(
                branch=b,
                info=zodiac_info(b),
                relation=rel,
                relation_label=label,
            )
            for b in BRANCH_ORDER
            for rel, label in [relation_of(year_branch, b)]
        ]

        pillar_zodiacs = [
            PillarZodiac(
                branch=b,
                info=zodiac_info(b),
                pillar_label=_PILLAR_ROLES[i]["label"],
                role=_PILLAR_ROLES[i]["role"],
                role_desc=_PILLAR_ROLES[i]["desc"],
                is_year=(i == 0),
            )
            for i, b in enumerate(pillar_branches)
        ]

        samhap = samhap_of(year_branch, pillar_branches)
        pillar_pairs = _build_pillar_pairs(pillar_branches)
        pillar_tip = _build_pillar_tip(pillar_branches)

        return ZodiacResult(
            year_branch=year_branch,
            year_info=year_info,
            relations=relations,
            pillar_zodiacs=pillar_zodiacs,
            pillar_pairs=pillar_pairs,
            pillar_tip=pillar_tip,
            samhap=samhap,
        )


def _build_pillar_pairs(pillar_branches: list[str]) -> list[PillarPair]:
    pairs: list[PillarPair] = []
    for i in range(len(pillar_branches)):
        for j in range(i + 1, len(pillar_branches)):
            a, b = pillar_branches[i], pillar_branches[j]
            if a == b:
                continue
            rel, label = relation_of(a, b)
            if rel not in _RELATION_PRIORITY:
                continue
            pairs.append(
                PillarPair(
                    i=i,
                    j=j,
                    pillar_label_a=_PILLAR_ROLES[i]["label"],
                    pillar_label_b=_PILLAR_ROLES[j]["label"],
                    branch_a=a,
                    branch_b=b,
                    zodiac_a=zodiac_info(a).korean,
                    zodiac_b=zodiac_info(b).korean,
                    relation=rel,
                    relation_label=label,
                )
            )
    pairs.sort(key=lambda p: (_RELATION_PRIORITY[p.relation], p.i, p.j))
    return pairs


def _build_pillar_tip(pillar_branches: list[str]) -> str:
    counts: dict[str, int] = {}
    for b in pillar_branches:
        counts[b] = counts.get(b, 0) + 1
    duplicates: list[tuple[str, int]] = [
        (zodiac_info(b).korean, cnt) for b, cnt in counts.items() if cnt >= 2
    ]

    rel_pairs: dict[str, list[str]] = {"삼합": [], "육합": [], "충": [], "원진": []}
    seen_pairs: set[tuple[str, str]] = set()
    for i in range(len(pillar_branches)):
        for j in range(i + 1, len(pillar_branches)):
            a, b = pillar_branches[i], pillar_branches[j]
            if a == b:
                continue
            key = tuple(sorted([a, b]))
            if key in seen_pairs:
                continue
            seen_pairs.add(key)
            rel, _ = relation_of(a, b)
            if rel in rel_pairs:
                rel_pairs[rel].append(f"{zodiac_info(a).korean}띠·{zodiac_info(b).korean}띠")

    harmony: list[str] = []
    tension: list[str] = []

    for kor, cnt in duplicates:
        harmony.append(f"{kor}띠가 {cnt}번 겹쳐 같은 결의 기운이 두텁게 쌓여요.")

    if rel_pairs["삼합"]:
        joined = ", ".join(rel_pairs["삼합"])
        harmony.append(f"{joined}가 삼합(三合)을 이뤄 한 방향으로 응집된 에너지가 흘러요.")

    if rel_pairs["육합"]:
        joined = ", ".join(rel_pairs["육합"])
        harmony.append(f"{joined}는 육합(六合)으로 부드럽게 맞물려 조화로운 결을 만들어요.")

    if rel_pairs["충"]:
        joined = ", ".join(rel_pairs["충"])
        tension.append(f"{joined}는 충(衝)으로 부딪혀 긴장과 변화의 동력이 함께 들어와요.")

    if rel_pairs["원진"]:
        joined = ", ".join(rel_pairs["원진"])
        tension.append(f"{joined}는 원진(怨嗔)으로 미세한 어긋남이 깔려 있어요.")

    if not harmony and not tension:
        return "사주지지는 특별한 충·합 없이 각 자리가 고르게 자기 결을 지키는 안정적인 구성이에요."

    if harmony and tension:
        body = f"{' '.join(harmony)} 반면 {' '.join(tension)}"
        closer = "응집과 충돌이 공존하는 역동적인 사주예요."
    elif harmony:
        body = " ".join(harmony)
        closer = "에너지가 한 방향으로 잘 모이는 단단한 사주예요."
    else:
        body = " ".join(tension)
        closer = "긴장감이 변화와 도전의 동력이 되는 사주예요."

    return f"{body} {closer}"
