from bazi.domain.ganji import Sipsin
from bazi.domain.natal import PostnatalInfo


class FortuneInterpreter:
    def __call__(self, postnatal: PostnatalInfo) -> list[str]:
        lines = []

        seun_sipsins = [postnatal.seun_stem[1], postnatal.seun_branch[1]]
        daeun_sipsins = [sipsin for _, sipsin in postnatal.daeun_sipsin]

        for domain_name, domain_sipsins in DOMAIN_MAP.items():
            seun_match = [sipsin for sipsin in seun_sipsins if sipsin in domain_sipsins]
            daeun_match = [sipsin for sipsin in daeun_sipsins if sipsin in domain_sipsins]

            key_sipsin = (seun_match or daeun_match or [None])[0]
            if key_sipsin is None:
                continue

            lines.append(f"[{domain_name}] {SIPSIN_DETAIL[key_sipsin]}")

            if domain_name == "재물운":
                lines.append(f"  💼 투자: {MODERN_INVEST[key_sipsin]}")
            elif domain_name == "직장·사회운":
                lines.append(f"  💼 커리어: {MODERN_CAREER[key_sipsin]}")
            elif domain_name == "학업·자격운":
                lines.append(f"  💼 커리어: {MODERN_CAREER[key_sipsin]}")
            elif domain_name in ("표현·건강운", "대인관계"):
                lines.append(f"  🌿 라이프: {MODERN_LIFESTYLE[key_sipsin]}")

        return lines


DOMAIN_MAP: dict[str, list[Sipsin]] = {
    "재물운": [Sipsin.偏財, Sipsin.正財],
    "직장·사회운": [Sipsin.偏官, Sipsin.正官],
    "학업·자격운": [Sipsin.偏印, Sipsin.正印],
    "표현·건강운": [Sipsin.食神, Sipsin.傷官],
    "대인관계": [Sipsin.比肩, Sipsin.劫財],
}

SIPSIN_DETAIL: dict[Sipsin, str] = {
    Sipsin.比肩: "동료·경쟁자가 많아지며 독립심이 강해집니다.",
    Sipsin.劫財: "경쟁이 치열해지고 재물 관리에 주의가 필요합니다.",
    Sipsin.食神: "재능 발휘와 표현력이 좋아지며 식복이 따릅니다.",
    Sipsin.傷官: "창의력이 높아지나 대인관계에서 마찰이 생길 수 있습니다.",
    Sipsin.偏財: "투자·사업 기회가 오며 유동적 재물 운이 활발합니다.",
    Sipsin.正財: "안정적 수입이 기대되며 저축·근면한 재물 운입니다.",
    Sipsin.偏官: "변화와 도전이 찾아오며 권력·승진 기회가 있습니다.",
    Sipsin.正官: "직장에서 인정받고 명예가 올라가는 시기입니다.",
    Sipsin.偏印: "영감과 아이디어가 풍부하나 안정감은 떨어질 수 있습니다.",
    Sipsin.正印: "학업·자격 취득에 유리하고 윗사람의 도움이 있습니다.",
}

MODERN_CAREER: dict[Sipsin, str] = {
    Sipsin.比肩: "1인 기업, 프리랜서, 독립 컨설턴트 등 자율성이 높은 일이 잘 맞습니다.",
    Sipsin.劫財: "공동 창업이나 파트너십보다는 단독 의사결정이 가능한 포지션이 유리합니다.",
    Sipsin.食神: "콘텐츠 크리에이터, 요리·외식업, 강연·교육 등 표현력을 살리는 분야가 좋습니다.",
    Sipsin.傷官: "스타트업, 예술·디자인, 기획·마케팅 등 틀을 깨는 창의적 직종에서 두각을 나타냅니다.",
    Sipsin.偏財: "부동산 투기보다는 성장주·벤처투자·사업 확장 등 공격적인 재테크가 맞는 시기입니다.",
    Sipsin.正財: "변동성이 큰 코인이나 주식보다는 배당주·적금·부동산처럼 따박따박 들어오는 수익 모델이 사주에 더 잘 맞습니다.",
    Sipsin.偏官: "이직·전직의 기회가 오며, 새로운 조직이나 도전적인 프로젝트에서 승진 가능성이 높습니다.",
    Sipsin.正官: "대기업·공공기관·전문직 등 안정적인 조직에서 인정받기 좋은 시기입니다. 승진 심사나 인사 평가에 유리합니다.",
    Sipsin.偏印: "IT·AI·데이터 분석 등 첨단 분야나 자격증·특수 기술 습득에 유리한 시기입니다.",
    Sipsin.正印: "대학원 진학, 전문 자격증(CPA·변호사·의사 등) 취득, 사내 교육·연수에 최적의 타이밍입니다.",
}

MODERN_INVEST: dict[Sipsin, str] = {
    Sipsin.比肩: "남의 투자 정보보다 본인만의 원칙을 세워 독자적으로 운용하는 것이 낫습니다.",
    Sipsin.劫財: "보증·동업·대출은 피하고, 지출 관리 앱 등으로 재정을 철저히 통제하세요.",
    Sipsin.食神: "취미가 수익이 되는 사이드 프로젝트, 지식 판매(전자책·강의)가 좋습니다.",
    Sipsin.傷官: "특허·저작권 등 지적재산 투자나 크리에이터 이코노미에 주목하세요.",
    Sipsin.偏財: "분산 투자보다는 확신 있는 한두 종목에 집중하는 전략이 맞는 시기입니다.",
    Sipsin.正財: "ISA·연금저축·우량 배당주 등 장기 복리 전략이 가장 효과적입니다.",
    Sipsin.偏官: "시장 변동기에 기회가 오므로, 현금 비중을 높여두고 타이밍을 노리세요.",
    Sipsin.正官: "회사 스톡옵션·우리사주 등 소속 조직과 연계된 자산 형성이 유리합니다.",
    Sipsin.偏印: "블록체인·AI 관련주 등 미래 기술 테마에 소액으로 분산 투자해 보세요.",
    Sipsin.正印: "자기 계발 투자(교육·건강)가 장기적으로 가장 높은 수익률을 보입니다.",
}

MODERN_LIFESTYLE: dict[Sipsin, str] = {
    Sipsin.比肩: "혼자 하는 운동(러닝·등산·헬스)이 스트레스 해소에 효과적입니다.",
    Sipsin.劫財: "충동 구매를 줄이고, 정기적인 가계부 점검 루틴을 만드세요.",
    Sipsin.食神: "맛집 탐방, 요리 클래스, 미식 여행 등이 행운을 끌어옵니다.",
    Sipsin.傷官: "예술 활동(그림·음악·글쓰기)으로 감정을 표현하면 대인관계 마찰이 줄어듭니다.",
    Sipsin.偏財: "새로운 사람·장소를 적극적으로 만나세요. 네트워킹 모임이 기회가 됩니다.",
    Sipsin.正財: "규칙적인 생활 패턴과 루틴이 운을 안정시킵니다. 절약이 미덕인 해입니다.",
    Sipsin.偏官: "격투기·클라이밍 등 도전적인 스포츠가 넘치는 에너지를 해소해 줍니다.",
    Sipsin.正官: "품격 있는 취미(골프·와인·독서모임)가 인맥과 명예에 도움이 됩니다.",
    Sipsin.偏印: "명상·요가·디지털 디톡스로 불안한 마음을 다스리세요.",
    Sipsin.正印: "독서 챌린지, 온라인 강의 수강 등 배움의 즐거움을 만끽하세요.",
}
