"""십신(十神) - 일간(나)을 기준으로 다른 글자와의 10가지 관계.

오행 관계 5가지 × 음양 일치 여부 2가지 = 10가지.

  오행 관계          같은 음양(偏)    다른 음양(正)
  ─────────────────────────────────────────────
  같은 오행          比肩(비견)       劫財(겁재)
  내가 생하는 오행    食神(식신)       傷官(상관)
  내가 극하는 오행    偏財(편재)       正財(정재)
  나를 극하는 오행    偏官(편관)       正官(정관)
  나를 생하는 오행    偏印(편인)       正印(정인)

한자 뜻:
  比肩 = 어깨를 나란히 하다 → 동료
  劫財 = 재물을 빼앗다 → 경쟁자
  食神 = 먹을 복의 신 → 재능, 의식주
  傷官 = 관을 상하게 하다 → 규율 파괴, 자유
  偏財 = 치우친 재물 → 뜻밖의 재물, 투자
  正財 = 바른 재물 → 근면한 수입, 저축
  偏官 = 치우친 관직 → 압박, 돌발 변수
  正官 = 바른 관직 → 안정된 직장, 명예
  偏印 = 치우친 도장 → 편학, 영감, 고독
  正印 = 바른 도장 → 정통 학문, 자격, 어머니
"""

from enum import Enum

from bazi.domain.ganji import lookup


class Sipsin(Enum):
    """십신(十神) - 10가지 관계.

    value는 해당 십신의 영역(domain) 해석이다.
    """

    比肩 = "동료·경쟁·독립"      # 비견 - 같은 오행, 같은 음양
    劫財 = "경쟁·손재·형제"      # 겁재 - 같은 오행, 다른 음양
    食神 = "재능·표현·식복"      # 식신 - 내가 생함, 같은 음양
    傷官 = "자유·반항·창의"      # 상관 - 내가 생함, 다른 음양
    偏財 = "투자·유동재산·아버지"  # 편재 - 내가 극함, 같은 음양
    正財 = "안정적수입·저축·근면"  # 정재 - 내가 극함, 다른 음양
    偏官 = "권력·압박·변동"      # 편관 - 나를 극함, 같은 음양
    正官 = "직장·명예·규율"      # 정관 - 나를 극함, 다른 음양
    偏印 = "영감·편학·고독"      # 편인 - 나를 생함, 같은 음양
    正印 = "학문·자격·어머니"     # 정인 - 나를 생함, 다른 음양

    @property
    def domain(self) -> str:
        """영역 해석을 반환한다."""
        return self.value

    @classmethod
    def of(cls, day_stem: str, char: str) -> "Sipsin":
        """일간 기준으로 한 글자의 십신을 판별한다."""
        me = lookup(day_stem)
        target = lookup(char)
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
