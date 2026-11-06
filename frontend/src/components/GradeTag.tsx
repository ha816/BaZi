/**
 * 등급 라벨 — "나" 배지와 같은 꼴의 작은 알약: 최고(금) · 좋음(초록) · 주의(주황), 보통은 없음(null → 렌더 안 함).
 * 홈 오늘의 띠·별자리 격자 칸 오른쪽 위(corner)와 /zodiac·/stars의 제목 줄·목록 줄(size md)에 같은 것을 쓴다(2026-11-06 사용자 "라벨을 보지 않고서는 이로운 날인지 모른다 → 나 라고 붙인 것처럼 → 상세 페이지에도").
 * 띠는 오늘 일진의 띠와 맺는 관계로(gradeOfRelation), 별자리는 그 별자리의 오늘 점수로(gradeOfScore — 일반판 점수가 29~74에 몰려 레벨 70/40 대신 70/60/42).
 */
export type Grade = "최고" | "좋음" | "주의";

const PILL: Record<Grade, string> = { "최고": "bg-[var(--color-gold)]", "좋음": "bg-emerald-500", "주의": "bg-amber-500" };
const TONE: Record<Grade, string> = {
  "최고": "border-[var(--color-gold)] bg-[var(--color-gold-faint)]",
  "좋음": "border-emerald-300 bg-emerald-50",
  "주의": "border-amber-300 bg-amber-50",
};

export const gradeOfRelation = (relation: string): Grade | null =>
  relation === "나" ? "최고" : relation === "삼합" || relation === "육합" ? "좋음" : relation === "충" || relation === "원진" ? "주의" : null;
export const gradeOfScore = (score: number): Grade | null => (score >= 70 ? "최고" : score >= 60 ? "좋음" : score <= 42 ? "주의" : null);
/** 격자 칸 테두리·바탕 — 등급 색, 보통은 흰 칸 */
export const toneOf = (grade: Grade | null): string => (grade ? TONE[grade] : "border-[var(--color-border-light)] bg-white");

export default function GradeTag({ grade, corner = false, size = "sm", className = "" }: { grade: Grade | null; corner?: boolean; size?: "sm" | "md"; className?: string }) {
  if (!grade) return null;
  const sizeCls = size === "md" ? "text-[10px] px-2 py-0.5" : "text-[9px] px-1";
  return <span className={`${corner ? "absolute -top-1.5 -right-1" : "inline-flex items-center"} font-bold rounded-full text-white ${sizeCls} ${PILL[grade]} ${className}`}>{grade}</span>;
}
