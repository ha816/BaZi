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

/** 궁합 영역 고정 순서(JSONB가 키 순서를 지키지 않음) — 결과 화면 DomainTab과 같은 순서 */
export const COMPAT_DOMAIN_ORDER = ["연애", "결혼", "재물", "직업"] as const;

/** 관계 유형별 영역 표시 이름 — 백엔드 DOMAIN_LABEL_BY_REL과 같은 표(표시용 이름만) */
export const COMPAT_DOMAIN_LABEL: Record<RelationType, Record<string, string>> = {
  lover: { 연애: "연애", 결혼: "결혼", 재물: "재물", 직업: "직업" },
  friend: { 연애: "친밀감", 결혼: "신뢰·약속", 재물: "재물 협력", 직업: "협업" },
  family: { 연애: "정서 교감", 결혼: "유대", 재물: "가운(家運)", 직업: "함께 이루는 일" },
};

/** 궁합 75점 이상에 찍는 직인 — public/kkachi/seal (2026-10-23) */
export const COMPAT_SEAL: Record<RelationType, { file: string; alt: string }> = {
  lover: { file: "cheonsaeng_yeonbun", alt: "천생연분(天生緣分)" },
  friend: { file: "magyeok_jigyo", alt: "막역지교(莫逆之交)" },
  family: { file: "gahwa_mansa", alt: "가화만사(家和萬事)" },
};
export const COMPAT_SEAL_MIN_SCORE = 75; // 2026-10-23 80 → 75(150쌍 중 80+는 2쌍뿐이라, 사용자 결정)

/** 영역 점수를 고정 순서·관계별 이름으로 */
export function orderedCompatDomains(scores: Record<string, { score: number }>, rel: RelationType): { key: string; label: string; score: number }[] {
  return COMPAT_DOMAIN_ORDER.filter((k) => scores[k]).map((k) => ({ key: k, label: COMPAT_DOMAIN_LABEL[rel]?.[k] ?? k, score: scores[k].score }));
}
