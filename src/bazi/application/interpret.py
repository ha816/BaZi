"""종합 해석: NatalInfo + PostnatalInfo를 받아 규칙 기반 해석 문장을 생성한다."""

from bazi.domain.natal import NatalInfo, PostnatalInfo


class Interpreter:
    """종합 해석기 — 선천 + 후천 데이터를 받아 해석 문장을 반환한다."""

    natal: NatalInfo
    postnatal: PostnatalInfo

    def __call__(self, natal: NatalInfo, postnatal: PostnatalInfo) -> list[str]:
        self.natal = natal
        self.postnatal = postnatal
        return self._build_summary()

    def _build_summary(self) -> list[str]:
        """규칙 기반으로 종합 해석 문장을 생성한다."""
        lines = []
        yongshin = self.natal.yongshin
        year = self.postnatal.year

        # 용신 충족
        if self.postnatal.yongshin_in_seun and self.postnatal.yongshin_in_daeun:
            lines.append(f"{year}년은 세운과 대운 모두 용신({yongshin.name})이 작용하여 매우 유리한 해입니다.")
        elif self.postnatal.yongshin_in_seun:
            lines.append(f"{year}년 세운에 용신({yongshin.name})이 있어 올해의 기회를 잘 살릴 수 있습니다.")
        elif self.postnatal.yongshin_in_daeun:
            lines.append(f"대운에 용신({yongshin.name})이 있어 큰 흐름은 좋으나, {year}년 세운에는 용신이 부재합니다.")
        else:
            lines.append(f"{year}년은 세운과 대운 모두 용신({yongshin.name})이 없어 신중한 판단이 필요합니다.")

        # 세운 십신 해석
        for char, s in [self.postnatal.seun_stem, self.postnatal.seun_branch]:
            lines.append(f"세운 {char}({s.name}): {s.domain} 방면에 변화가 예상됩니다.")

        # 대운 십신 해석
        d = self.postnatal.current_daeun
        if d and self.postnatal.daeun_sipsin:
            lines.append(f"현재 대운 {d.ganji}({d.start_age}~{d.end_age}세):")
            for char, s in self.postnatal.daeun_sipsin:
                lines.append(f"  대운 {char}({s.name}): {s.domain} 방면의 큰 흐름이 작용합니다.")

        # 십이운성 (일주 기준)
        if self.natal.sibi_unseong:
            _, day_unseong = self.natal.sibi_unseong[2]
            lines.append(f"일주 십이운성은 {day_unseong.name}({day_unseong.meaning})입니다.")

        # 신살
        for branch, s in self.natal.sinsal:
            lines.append(f"사주에 {s.korean}({branch.name})이(가) 있습니다: {s.meaning}.")

        # 충
        for clash in self.postnatal.seun_clashes:
            lines.append(f"주의: 세운 {clash['incoming']}이(가) {clash['pillar']} {clash['target']}과(와) 충(衝)합니다. 변동·갈등에 유의하세요.")
        for clash in self.postnatal.daeun_clashes:
            lines.append(f"주의: 대운 {clash['incoming']}이(가) {clash['pillar']} {clash['target']}과(와) 충(衝)합니다. 이 시기 큰 변화가 있을 수 있습니다.")

        # 합
        for combine in self.postnatal.seun_combines:
            lines.append(f"세운 {combine['incoming']}이(가) {combine['pillar']} {combine['target']}과(와) {combine['type']}합니다. 새로운 인연·협력이 기대됩니다.")
        for combine in self.postnatal.daeun_combines:
            lines.append(f"대운 {combine['incoming']}이(가) {combine['pillar']} {combine['target']}과(와) {combine['type']}합니다. 장기적 관계·변화가 예상됩니다.")

        return lines
