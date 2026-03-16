"""간지(干支) - 천간(天干, 줄기)과 지지(地支, 가지)의 기본 데이터.

간지는 사주의 최소 구성 단위이다.
  - 천간(干) 10개: 甲 乙 丙 丁 戊 己 庚 辛 壬 癸
  - 지지(支) 12개: 子 丑 寅 卯 辰 巳 午 未 申 酉 戌 亥
각 글자에는 오행(목/화/토/금/수)과 음양(양/음)이 배정되어 있다.
천간 하나 + 지지 하나 = 하나의 기둥(柱), 기둥 4개 = 사주(四柱).
"""

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
