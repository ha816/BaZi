from enum import Enum


class Oheng(Enum):
    """오행(五行) - 木(나무), 火(불), 土(흙), 金(쇠), 水(물).

    value는 (한글 뜻풀이, 성격 해석) 튜플이다.
    순서: 木(0)→火(1)→土(2)→金(3)→水(4)
      상생(相生): 서로 돕는 관계. 순환에서 다음 (+1) 木→火→土→金→水→木
      상극(相剋): 서로 억제하는 관계. 순환에서 두 칸 뒤 (+2) 木→土→水→火→金→木
    """

    木 = ("나무", "성장과 추진력이 강하며 리더십이 있습니다.")
    火 = ("불", "열정적이고 솔직하며 감정 표현이 확실합니다.")
    土 = ("흙", "신용을 중시하며 포용력이 있고 듬직합니다.")
    金 = ("쇠", "결단력이 있고 냉철하며 원칙을 중요시합니다.")
    水 = ("물", "지혜롭고 유연하며 적응력이 뛰어납니다.")

    def __init__(self, meaning: str, personality: str):
        self.meaning = meaning
        self.personality = personality

    @property
    def generates(self) -> "Oheng":
        """상생(相生): 내가 생하는 오행. 木→火→土→金→水→木"""
        members = list(Oheng)
        return members[(members.index(self) + 1) % 5]

    @property
    def overcomes(self) -> "Oheng":
        """상극(相剋): 내가 극하는 오행. 木→土→水→火→金→木"""
        members = list(Oheng)
        return members[(members.index(self) + 2) % 5]

    @property
    def generated_by(self) -> "Oheng":
        """나를 생해주는 오행. (역상생)"""
        members = list(Oheng)
        return members[(members.index(self) - 1) % 5]


class Stem(Enum):
    """천간(天干) - 10개의 하늘 기운.
    각 천간은 순서(order), 오행(element: Oheng), 음양(is_yang)을 속성으로 가진다.
    """

    甲 = (0, Oheng.木, True)  # 갑목(甲木) - 양목, 큰 나무
    乙 = (1, Oheng.木, False)  # 을목(乙木) - 음목, 풀·꽃
    丙 = (2, Oheng.火, True)  # 병화(丙火) - 양화, 태양
    丁 = (3, Oheng.火, False)  # 정화(丁火) - 음화, 촛불
    戊 = (4, Oheng.土, True)  # 무토(戊土) - 양토, 산·큰 땅
    己 = (5, Oheng.土, False)  # 기토(己土) - 음토, 밭·정원
    庚 = (6, Oheng.金, True)  # 경금(庚金) - 양금, 바위·칼
    辛 = (7, Oheng.金, False)  # 신금(辛金) - 음금, 보석·바늘
    壬 = (8, Oheng.水, True)  # 임수(壬水) - 양수, 바다·큰 강
    癸 = (9, Oheng.水, False)  # 계수(癸水) - 음수, 이슬·샘물

    def __init__(self, order: int, element: Oheng, is_yang: bool):
        self.order = order
        self.element = element
        self.is_yang = is_yang

    @classmethod
    def by_order(cls, index: int) -> "Stem":
        """순서(0~9)로 천간을 찾는다. 순환 지원."""
        return list(cls)[index % 10]

    @classmethod
    def from_char(cls, char: str) -> "Stem":
        """한자 한 글자로 천간을 찾는다. 없으면 KeyError."""
        return cls[char]

    @property
    def combines(self) -> "Stem":
        """천간합(天干合): 나와 합이 되는 천간."""
        return StemCombine.partner_of(self)


class Branch(Enum):
    """지지(地支) - 12개의 땅 기운. 子 丑 寅 卯 辰 巳 午 未 申 酉 戌 亥.

    각 지지는 순서(order), 오행(element: Oheng), 음양(is_yang)을 속성으로 가진다.
    12지지는 12동물(띠)과도 대응된다.
    """

    子 = (0, Oheng.水, True)  # 자(子) - 쥐, 양수
    丑 = (1, Oheng.土, False)  # 축(丑) - 소, 음토
    寅 = (2, Oheng.木, True)  # 인(寅) - 호랑이, 양목
    卯 = (3, Oheng.木, False)  # 묘(卯) - 토끼, 음목
    辰 = (4, Oheng.土, True)  # 진(辰) - 용, 양토
    巳 = (5, Oheng.火, False)  # 사(巳) - 뱀, 음화
    午 = (6, Oheng.火, True)  # 오(午) - 말, 양화
    未 = (7, Oheng.土, False)  # 미(未) - 양, 음토
    申 = (8, Oheng.金, True)  # 신(申) - 원숭이, 양금
    酉 = (9, Oheng.金, False)  # 유(酉) - 닭, 음금
    戌 = (10, Oheng.土, True)  # 술(戌) - 개, 양토
    亥 = (11, Oheng.水, False)  # 해(亥) - 돼지, 음수

    def __init__(self, order: int, element: Oheng, is_yang: bool):
        self.order = order
        self.element = element
        self.is_yang = is_yang

    @classmethod
    def by_order(cls, index: int) -> "Branch":
        """순서(0~11)로 지지를 찾는다. 순환 지원."""
        return list(cls)[index % 12]

    @classmethod
    def from_char(cls, char: str) -> "Branch":
        """한자 한 글자로 지지를 찾는다. 없으면 KeyError."""
        return cls[char]

    @property
    def clashes(self) -> "Branch":
        """지지충(地支衝): 나와 충돌하는 지지."""
        return BranchClash.partner_of(self)

    @property
    def combines(self) -> "Branch":
        """지지육합(地支六合): 나와 합이 되는 지지."""
        return BranchCombine.partner_of(self)


class StemCombine(Enum):
    """천간합(天干合) - 두 천간이 만나 합이 되는 5쌍.

    양간(陽干)과 음간(陰干)이 짝을 이루며,
    합이 되면 새로운 오행으로 변화한다고 본다.
    """

    甲己 = (Stem.甲, Stem.己)  # 갑기합화토(甲己合化土)
    乙庚 = (Stem.乙, Stem.庚)  # 을경합화금(乙庚合化金)
    丙辛 = (Stem.丙, Stem.辛)  # 병신합화수(丙辛合化水)
    丁壬 = (Stem.丁, Stem.壬)  # 정임합화목(丁壬合化木)
    戊癸 = (Stem.戊, Stem.癸)  # 무계합화화(戊癸合化火)

    def __init__(self, first: Stem, second: Stem):
        self.first = first
        self.second = second

    @classmethod
    def partner_of(cls, stem: Stem) -> Stem:
        """주어진 천간과 합이 되는 천간을 반환한다."""
        for pair in cls:
            if pair.first == stem:
                return pair.second
            if pair.second == stem:
                return pair.first
        raise ValueError(f"No combine partner for {stem}")


class StemBranch:
    """간지(干支) - 천간과 지지의 조합. 사주의 각 기둥을 구성하는 단위."""

    def __init__(self, stem: Stem, branch: Branch):
        self.stem = stem
        self.branch = branch

    @classmethod
    def from_text(cls, text: str) -> "StemBranch":
        return cls(Stem.from_char(text[0]), Branch.from_char(text[1]))

    def __str__(self) -> str:
        return self.stem.name + self.branch.name

    def __eq__(self, other: object) -> bool:
        if isinstance(other, StemBranch):
            return self.stem == other.stem and self.branch == other.branch
        return NotImplemented

    def __hash__(self) -> int:
        return hash((self.stem, self.branch))


class Pillar(Enum):
    """사주의 네 기둥(四柱).

    order는 기둥의 위치(0~3), korean은 한글 이름이다.
    """

    年柱 = "년주"  # 연주 - 태어난 해
    月柱 = "월주"  # 월주 - 태어난 달
    日柱 = "일주"  # 일주 - 태어난 날
    時柱 = "시주"  # 시주 - 태어난 시

    @property
    def korean(self) -> str:
        return self.value


class BranchCombine(Enum):
    """지지육합(地支六合) - 두 지지가 만나 합이 되는 6쌍.

    합이 되면 새로운 오행으로 변화한다고 본다.
    """

    子丑 = (Branch.子, Branch.丑)  # 자축합화토(子丑合化土)
    寅亥 = (Branch.寅, Branch.亥)  # 인해합화목(寅亥合化木)
    卯戌 = (Branch.卯, Branch.戌)  # 묘술합화화(卯戌合化火)
    辰酉 = (Branch.辰, Branch.酉)  # 진유합화금(辰酉合化金)
    巳申 = (Branch.巳, Branch.申)  # 사신합화수(巳申合化水)
    午未 = (Branch.午, Branch.未)  # 오미합화토(午未合化土)

    def __init__(self, first: Branch, second: Branch):
        self.first = first
        self.second = second

    @classmethod
    def partner_of(cls, branch: Branch) -> Branch:
        """주어진 지지와 합이 되는 지지를 반환한다."""
        for pair in cls:
            if pair.first == branch:
                return pair.second
            if pair.second == branch:
                return pair.first
        raise ValueError(f"No combine partner for {branch}")


class BranchClash(Enum):
    """지지충(地支衝) - 두 지지가 정면으로 충돌하는 6쌍.

    지지 원형에서 정반대(order 차이 6)에 위치한 쌍이다.
    충이 발생하면 변동·갈등의 의미가 있다.
    """

    子午 = (Branch.子, Branch.午)
    丑未 = (Branch.丑, Branch.未)
    寅申 = (Branch.寅, Branch.申)
    卯酉 = (Branch.卯, Branch.酉)
    辰戌 = (Branch.辰, Branch.戌)
    巳亥 = (Branch.巳, Branch.亥)

    def __init__(self, first: Branch, second: Branch):
        self.first = first
        self.second = second

    @classmethod
    def partner_of(cls, branch: Branch) -> Branch:
        """주어진 지지와 충돌하는 지지를 반환한다."""
        for pair in cls:
            if pair.first == branch:
                return pair.second
            if pair.second == branch:
                return pair.first
        raise ValueError(f"No clash partner for {branch}")


class Sipsin(Enum):
    """십신(十神) - 일간(나)을 기준으로 다른 글자와의 10가지 관계.

    오행 관계 5가지 × 음양 일치 여부 2가지 = 10가지.
    value는 해당 십신의 영역(domain) 해석이다.
    """

    比肩 = "동료·경쟁·독립"  # 비견 - 같은 오행, 같은 음양
    劫財 = "경쟁·손재·형제"  # 겁재 - 같은 오행, 다른 음양
    食神 = "재능·표현·식복"  # 식신 - 내가 생함, 같은 음양
    傷官 = "자유·반항·창의"  # 상관 - 내가 생함, 다른 음양
    偏財 = "투자·유동재산·아버지"  # 편재 - 내가 극함, 같은 음양
    正財 = "안정적수입·저축·근면"  # 정재 - 내가 극함, 다른 음양
    偏官 = "권력·압박·변동"  # 편관 - 나를 극함, 같은 음양
    正官 = "직장·명예·규율"  # 정관 - 나를 극함, 다른 음양
    偏印 = "영감·편학·고독"  # 편인 - 나를 생함, 같은 음양
    正印 = "학문·자격·어머니"  # 정인 - 나를 생함, 다른 음양

    @property
    def domain(self) -> str:
        """영역 해석을 반환한다."""
        return self.value

    @classmethod
    def of(cls, me: "Stem | Branch", target: "Stem | Branch") -> "Sipsin":
        """일간 기준으로 대상 글자의 십신을 판별한다."""
        same_yinyang = me.is_yang == target.is_yang
        me_el = me.element
        target_el = target.element

        if me_el == target_el:
            return cls.比肩 if same_yinyang else cls.劫財
        elif me_el.generates == target_el:
            return cls.食神 if same_yinyang else cls.傷官
        elif me_el.overcomes == target_el:
            return cls.偏財 if same_yinyang else cls.正財
        elif target_el.generates == me_el:
            return cls.偏印 if same_yinyang else cls.正印
        else:
            return cls.偏官 if same_yinyang else cls.正官


class SibiUnseong(Enum):
    """십이운성(十二運星) - 천간이 지지를 만났을 때의 에너지 상태 12단계.

    생왕사절(生旺死絶)이라고도 하며, 천간의 기운이 지지에서
    어떤 상태에 있는지를 나타낸다.
    """

    長生 = "태어남, 새로운 시작"
    沐浴 = "불안정, 변화, 감정 기복"
    冠帶 = "성장, 준비, 자립"
    建祿 = "안정, 실력 발휘"
    帝旺 = "최절정, 왕성한 활동"
    衰 = "쇠퇴, 내려가는 기운"
    病 = "약화, 조심 필요"
    死 = "정지, 전환점"
    墓 = "저장, 내면 집중"
    絕 = "단절, 새로운 씨앗"
    胎 = "잉태, 가능성"
    養 = "양육, 준비 단계"

    @property
    def meaning(self) -> str:
        return self.value

    @classmethod
    def _jangseong_start(cls) -> dict:
        """각 천간의 長生이 시작되는 지지 (lazy 초기화)."""
        if not hasattr(cls, '_JANGSEONG_START'):
            cls._JANGSEONG_START = {
                Stem.甲: Branch.亥, Stem.乙: Branch.午,
                Stem.丙: Branch.寅, Stem.丁: Branch.酉,
                Stem.戊: Branch.寅, Stem.己: Branch.酉,
                Stem.庚: Branch.巳, Stem.辛: Branch.子,
                Stem.壬: Branch.申, Stem.癸: Branch.卯,
            }
        return cls._JANGSEONG_START

    @classmethod
    def of(cls, stem: Stem, branch: Branch) -> "SibiUnseong":
        """천간이 지지를 만났을 때의 십이운성을 반환한다."""
        start = cls._jangseong_start()[stem]
        if stem.is_yang:
            offset = (branch.order - start.order) % 12
        else:
            offset = (start.order - branch.order) % 12
        return list(cls)[offset]
