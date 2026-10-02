import type { RelationType } from "@/types/analysis";

export interface RelationStyle {
  label: string;
  color: string;
  bg: string;
  border: string;
}

export const RELATION_STYLE: Record<string, RelationStyle> = {
  "나":   { label: "나",        color: "#8A5A10", bg: "#F5DC90", border: "#C89030" },
  "삼합": { label: "삼합(三合)", color: "#1A7A4A", bg: "#C8EDD8", border: "#5CB882" },
  "육합": { label: "육합(六合)", color: "#1A5FA0", bg: "#C8DFF5", border: "#5A9ED0" },
  "보통": { label: "보통",       color: "#8A8A96", bg: "#F0F0F4", border: "#C8C8D4" },
  "원진": { label: "원진(怨嗔)", color: "#B05A20", bg: "#FCDDC0", border: "#E09050" },
  "충":   { label: "충(衝)",     color: "#B82020", bg: "#FBCFC8", border: "#E07070" },
};

/** 궁합 카드 제목의 두 사람 사이 기호 — OG 폰트 서브셋(public/fonts)에 있는 것만. ✦·✕·이모지는 없다 */
export const RELATION_GLYPH: Record<RelationType, string> = { lover: "♥", friend: "★", family: "✿" };
