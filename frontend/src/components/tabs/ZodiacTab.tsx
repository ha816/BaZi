import type { NatalResult, PostnatalResult } from "@/types/analysis";

const ZODIAC: Record<string, { kor: string; emoji: string; keywords: string[] }> = {
  "子": { kor: "쥐",    emoji: "🐭", keywords: ["영민함", "민첩함", "사교성"] },
  "丑": { kor: "소",    emoji: "🐂", keywords: ["성실함", "인내",   "신뢰"] },
  "寅": { kor: "호랑이", emoji: "🐯", keywords: ["용기",   "리더십", "열정"] },
  "卯": { kor: "토끼",  emoji: "🐰", keywords: ["온화함", "직관",   "예술성"] },
  "辰": { kor: "용",    emoji: "🐲", keywords: ["카리스마","야망",   "창의"] },
  "巳": { kor: "뱀",    emoji: "🐍", keywords: ["지혜",   "신중함", "통찰"] },
  "午": { kor: "말",    emoji: "🐴", keywords: ["자유",   "활동성", "독립"] },
  "未": { kor: "양",    emoji: "🐑", keywords: ["평화",   "온순",   "예술감"] },
  "申": { kor: "원숭이", emoji: "🐒", keywords: ["기지",   "유머",   "적응력"] },
  "酉": { kor: "닭",    emoji: "🐓", keywords: ["꼼꼼함", "성실",   "완벽주의"] },
  "戌": { kor: "개",    emoji: "🐕", keywords: ["충직함", "의리",   "정직"] },
  "亥": { kor: "돼지",  emoji: "🐗", keywords: ["복",     "너그러움","성실"] },
};

const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const CLASH_PAIRS: [string, string][] = [
  ["子","午"],["丑","未"],["寅","申"],["卯","酉"],["辰","戌"],["巳","亥"],
];
const SAMHAP: [string[], string][] = [
  [["寅","午","戌"],"火"],[["亥","卯","未"],"木"],
  [["申","子","辰"],"水"],[["巳","酉","丑"],"金"],
];

function getZodiacRelation(myBranch: string, year: number): string {
  const yb = BRANCHES[(year - 4) % 12];
  if (myBranch === yb) return `올해(${yb}年)와 같은 해예요. 본명년(本命年)으로 변화가 많은 해입니다.`;
  const clash = CLASH_PAIRS.find(([a, b]) => (a === myBranch && b === yb) || (b === myBranch && a === yb));
  if (clash) return `올해(${yb}年)와 충(衝)이 있어요. 예상치 못한 변화에 유연하게 대처하세요.`;
  const samhap = SAMHAP.find(([g]) => g.includes(myBranch) && g.includes(yb));
  if (samhap) return `올해(${yb}年)와 삼합(${samhap[1]}気)이 맞아요. 좋은 기운이 따릅니다.`;
  return `올해(${yb}年)와 특별한 충·합은 없어요. 꾸준히 나아가기 좋은 해예요.`;
}

interface Props {
  natal: NatalResult;
  postnatal: PostnatalResult;
}

export default function ZodiacTab({ natal, postnatal }: Props) {
  const yearBranch = natal.pillars[0]?.[1] ?? "";
  const zodiac = ZODIAC[yearBranch];

  if (!zodiac) return null;

  return (
    <div className="space-y-4">
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">
            {zodiac.emoji} {zodiac.kor}띠 — {yearBranch}年
          </h3>
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-[var(--color-ivory-warm)] flex items-center justify-center text-4xl">
              {zodiac.emoji}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {zodiac.keywords.map((kw) => (
                <span key={kw} className="text-xs bg-[var(--color-ivory)] border border-[var(--color-border-light)] rounded-full px-2.5 py-0.5 text-[var(--color-ink-muted)]">
                  {kw}
                </span>
              ))}
            </div>
          </div>
          <p className="text-sm text-[var(--color-ink-light)] leading-relaxed pt-4 border-t border-[var(--color-border-light)]">
            {getZodiacRelation(yearBranch, postnatal.year)}
          </p>
        </div>
      </div>
    </div>
  );
}
