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
