export const ZODIAC_EMOJIS: Record<string, string> = {
  "子": "🐭", // 쥐
  "丑": "🐂", // 소
  "寅": "🐯", // 호랑이
  "卯": "🐰", // 토끼
  "辰": "🐲", // 용
  "巳": "🐍", // 뱀
  "午": "🐴", // 말
  "未": "🐑", // 양
  "申": "🐒", // 원숭이
  "酉": "🐓", // 닭
  "戌": "🐶", // 개
  "亥": "🐷", // 돼지
};

export const BRANCH_ORDER: string[] = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

/**
 * birth_dt(ISO)를 받아서 해당 연도의 지지(띠) 한자를 반환합니다.
 * 간단한 수식: (연도 - 4) % 12 -> 지지 인덱스 (0: 子, 1: 丑, ...)
 */
export function getZodiacBranch(birthDt: string): string {
  const year = new Date(birthDt).getFullYear();
  const index = (year - 4) % 12;
  // (index + 12) % 12는 음수 대비용
  return BRANCH_ORDER[(index + 12) % 12];
}

export function getZodiacEmoji(birthDt: string): string {
  const branch = getZodiacBranch(birthDt);
  return ZODIAC_EMOJIS[branch] ?? "🪶";
}
