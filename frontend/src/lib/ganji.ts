// 한자→한글 매핑은 백엔드 응답에 *_korean 필드로 들어 있어요.
// 다만 SVG 다이어그램·60갑자 스트립처럼 한자 그대로 그릴 때 한국음을 옆에 보여주는
// 표시 전용 케이스가 남아 있어, 표시용 fallback으로만 이 맵을 사용합니다.

export const STEM_KOR: Record<string, string> = {
  甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무",
  己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
};

export const BRANCH_KOR: Record<string, string> = {
  子: "자", 丑: "축", 寅: "인", 卯: "묘", 辰: "진", 巳: "사",
  午: "오", 未: "미", 申: "신", 酉: "유", 戌: "술", 亥: "해",
};

export function ganjiKor(ganji: string): string {
  const s = STEM_KOR[ganji[0]] ?? ganji[0];
  const b = BRANCH_KOR[ganji[1]] ?? ganji[1];
  return `${s}${b}(${ganji})`;
}

export const STEM_ELEMENT: Record<string, string> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土",
  己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
};

export const BRANCH_ELEMENT: Record<string, string> = {
  子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火",
  午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水",
};

// rel_kind → 색상(presentation token).
// 백엔드 SipsinInfo.rel_kind에 맞춰 매핑.
export const REL_KIND_COLOR: Record<string, string> = {
  same: "#78716C",
  help_out: "#1B6B3A",
  help_in: "#1B6B3A",
  restrain_out: "#C0392B",
  restrain_in: "#C0392B",
};
