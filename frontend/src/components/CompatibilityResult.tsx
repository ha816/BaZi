"use client";

import type { CompatibilityResult } from "@/types/analysis";

interface Props {
  data: CompatibilityResult;
  name1: string;
  name2: string;
}

const DOMAIN_ICONS: Record<string, string> = {
  연애: "💕",
  결혼: "💍",
  재물: "💰",
  직업: "🤝",
};

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="w-full h-2 rounded-full bg-[var(--color-parchment)] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${score}%`,
          background:
            score >= 70
              ? "linear-gradient(90deg, var(--color-gold-light), var(--color-gold))"
              : score >= 45
              ? "linear-gradient(90deg, var(--color-earth), var(--color-gold-light))"
              : "linear-gradient(90deg, var(--color-water), var(--color-metal))",
        }}
      />
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color =
    score >= 70 ? "var(--color-gold)" : score >= 45 ? "var(--color-earth)" : "var(--color-water)";

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="rotate-[-90deg]">
      <circle cx="70" cy="70" r={r} fill="none" strokeWidth="10" stroke="var(--color-parchment)" />
      <circle
        cx="70"
        cy="70"
        r={r}
        fill="none"
        strokeWidth="10"
        stroke={color}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
}

export default function CompatibilityResult({ data, name1, name2 }: Props) {
  const { total_score, label, domain_scores, description, stem_combine, branch_combine, branch_clash } =
    data;

  const badges = [
    stem_combine && { text: "천간합 ✓", positive: true },
    branch_combine && { text: "지지합 ✓", positive: true },
    branch_clash && { text: "지지충 !", positive: false },
  ].filter(Boolean) as { text: string; positive: boolean }[];

  return (
    <div className="space-y-6">
      {/* 종합 점수 카드 */}
      <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-light)] shadow-sm p-7 md:p-9">


        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* 점수 링 */}
          <div className="relative flex-shrink-0">
            <ScoreRing score={total_score} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading text-4xl font-bold text-[var(--color-ink)]">
                {total_score}
              </span>
              <span className="text-xs text-[var(--color-ink-faint)]">점</span>
            </div>
          </div>

          {/* 텍스트 */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <h2 className="font-heading text-2xl font-bold text-[var(--color-ink)]">{label}</h2>
              {badges.map((b) => (
                <span
                  key={b.text}
                  className="text-xs font-medium px-2.5 py-1 rounded-full"
                  style={
                    b.positive
                      ? { background: "var(--color-gold-faint)", color: "var(--color-gold)" }
                      : { background: "#F7EDEC", color: "var(--color-fire)" }
                  }
                >
                  {b.text}
                </span>
              ))}
            </div>
            <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">{description}</p>
            <p className="text-sm text-[var(--color-ink-faint)]">
              {name1} × {name2}
            </p>
          </div>
        </div>
      </div>

      {/* 영역별 점수 */}
      <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-light)] shadow-sm p-7 md:p-9 space-y-6">
        <h3 className="font-heading text-lg font-semibold text-[var(--color-ink)]">영역별 궁합</h3>
        <div className="space-y-5">
          {Object.entries(domain_scores).map(([domain, info]) => (
            <div key={domain} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{DOMAIN_ICONS[domain] ?? "◎"}</span>
                  <span className="text-sm font-medium text-[var(--color-ink)]">{domain}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "var(--color-gold-faint)", color: "var(--color-gold)" }}
                  >
                    {info.level}
                  </span>
                </div>
                <span className="text-sm font-semibold text-[var(--color-ink-light)]">
                  {info.score}점
                </span>
              </div>
              <ScoreBar score={info.score} />
              <p className="text-xs text-[var(--color-ink-faint)] leading-relaxed">{info.reason}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
