# 천간(天干, Heavenly Stems) → 오행 매핑
STEM_ELEMENT_MAP: dict[str, str] = {
    "甲": "목", "乙": "목",
    "丙": "화", "丁": "화",
    "戊": "토", "己": "토",
    "庚": "금", "辛": "금",
    "壬": "수", "癸": "수",
}

# 지지(地支, Earthly Branches) → 오행 매핑
BRANCH_ELEMENT_MAP: dict[str, str] = {
    "寅": "목", "卯": "목",
    "巳": "화", "午": "화",
    "申": "금", "酉": "금",
    "亥": "수", "子": "수",
    "辰": "토", "戌": "토",
    "丑": "토", "未": "토",
}

# 천간 음양 매핑 (양=True, 음=False)
STEM_YINYANG_MAP: dict[str, bool] = {
    "甲": True, "乙": False,
    "丙": True, "丁": False,
    "戊": True, "己": False,
    "庚": True, "辛": False,
    "壬": True, "癸": False,
}

# 지지 음양 매핑 (양=True, 음=False)
BRANCH_YINYANG_MAP: dict[str, bool] = {
    "子": True, "丑": False,
    "寅": True, "卯": False,
    "辰": True, "巳": False,
    "午": True, "未": False,
    "申": True, "酉": False,
    "戌": True, "亥": False,
}

# 순서가 있는 리스트 (인덱스 기반 순환 계산용)
STEMS: list[str] = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]
BRANCHES: list[str] = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]

# 통합 매핑
ELEMENT_MAP: dict[str, str] = {**STEM_ELEMENT_MAP, **BRANCH_ELEMENT_MAP}
YINYANG_MAP: dict[str, bool] = {**STEM_YINYANG_MAP, **BRANCH_YINYANG_MAP}

# 상생 관계: key가 value를 생한다 (목→화→토→금→수→목)
GENERATING_MAP: dict[str, str] = {
    "목": "화",
    "화": "토",
    "토": "금",
    "금": "수",
    "수": "목",
}

# 상극 관계: key가 value를 극한다 (목→토→수→화→금→목)
OVERCOMING_MAP: dict[str, str] = {
    "목": "토",
    "토": "수",
    "수": "화",
    "화": "금",
    "금": "목",
}

# 오행별 기본 성격 해석
INTERPRETATIONS: dict[str, str] = {
    "목": "성장과 추진력이 강하며 리더십이 있습니다.",
    "화": "열정적이고 솔직하며 감정 표현이 확실합니다.",
    "토": "신용을 중시하며 포용력이 있고 듬직합니다.",
    "금": "결단력이 있고 냉철하며 원칙을 중요시합니다.",
    "수": "지혜롭고 유연하며 적응력이 뛰어납니다.",
}
