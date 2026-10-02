import type { PillarSnapshot } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";
import KkachiTip from "../KkachiTip";
import OhengPairDiagram from "../OhengPairDiagram";
import PillarPairDiagram from "../PillarPairDiagram";
import SectionHeader from "../SectionHeader";
import type { CompatTabProps } from "./types";

const ELEMENTS_ORDER = ["木", "火", "土", "金", "水"];

function elementsToKor(arr: string[]): string {
  return arr.map((e) => `${getElementInfo(e).korean}(${e})`).join(", ");
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

function ElementBar({ snapshot, label }: { snapshot: PillarSnapshot; label: string }) {
  const total = Math.max(1, Object.values(snapshot.element_stats).reduce((a, b) => a + b, 0));
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-[var(--color-ink-muted)]">{label}</p>
      <div className="space-y-1.5">
        {ELEMENTS_ORDER.map((el) => {
          const count = snapshot.element_stats[el] ?? 0;
          const pct = (count / total) * 100;
          const info = getElementInfo(el);
          return (
            <div key={el} className="flex items-center gap-2">
              <span className="w-7 text-xs font-bold" style={{ color: info.color }}>
                {info.korean}
              </span>
              <div className="flex-1 h-2 rounded-full" style={{ background: "var(--color-parchment)" }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${pct}%`, background: info.color }}
                />
              </div>
              <span className="w-5 text-right text-[10px] font-medium text-[var(--color-ink-faint)]">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 종합 궁합 — 점수 링·라벨·설명 + 삼합 완성·기둥 비교·오행 보완 */
export default function TotalTab({ data, name1, name2 }: CompatTabProps) {
  const { total_score, label, description, pillar1_snapshot, pillar2_snapshot, pillar_relations, element_complement, samhap_completions } = data;
  return (
    <div className="slide-card">
      <div className="slide-card__header">
        <SectionHeader title="종합 궁합" noMargin />
      </div>
      <div className="divider" />
      <div className="slide-card__body space-y-5">
        <KkachiTip>
          {name1}님과 {name2}님은 {label}이에요. 카드를 하나씩 펼치며 두 분의 관계를 풀어드릴게요.
        </KkachiTip>

        <div className="flex flex-col md:flex-row items-center gap-7">
          <div className="relative flex-shrink-0">
            <ScoreRing score={total_score} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading text-4xl font-bold text-[var(--color-ink)]">
                {total_score}
              </span>
              <span className="text-xs text-[var(--color-ink-faint)]">점</span>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-3">
            <h2 className="font-heading text-2xl font-bold text-[var(--color-ink)]">{label}</h2>
            <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">{description}</p>
          </div>
        </div>

        {pillar1_snapshot && pillar2_snapshot && (
          <div className="space-y-4">
            {samhap_completions.length > 0 && (
            <div className="space-y-2">
              {samhap_completions.map((c, i) => {
                const info = getElementInfo(c.element);
                return (
                  <div
                    key={i}
                    className="rounded-xl px-4 py-3 border flex items-center gap-3"
                    style={{ background: info.bgColor, borderColor: info.borderColor }}
                  >
                    <span className="font-heading text-2xl font-bold" style={{ color: info.color }}>
                      {c.branches.join("")}
                    </span>
                    <div className="flex-1 text-xs leading-relaxed" style={{ color: info.color }}>
                      <p className="font-semibold">
                        삼합 완성 — {info.label}({info.korean})국
                      </p>
                      <p className="opacity-80 mt-0.5">
                        {name1}님 {c.p1_branches.join("")} + {name2}님 {c.p2_branches.join("")} → 운명적 호흡
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {(pillar1_snapshot.hour_unknown || pillar2_snapshot.hour_unknown) && (
            <p className="text-[11px] text-[var(--color-ink-muted)] rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-ivory-warm)] px-3 py-2">
              🕰️ {pillar1_snapshot.hour_unknown && pillar2_snapshot.hour_unknown ? "두 분 모두" : pillar1_snapshot.hour_unknown ? `${name1}님의` : `${name2}님의`} 출생시간이 없어 시주(時柱) 비교는 뺐어요. 세 기둥 기준 점수예요.
            </p>
          )}
          <PillarPairDiagram
            p1={pillar1_snapshot}
            p2={pillar2_snapshot}
            relations={pillar_relations}
            name1={name1}
            name2={name2}
          />

          {/* ── 오행 보완 sub-section ── */}
          <div className="pt-2 mt-2 border-t border-[var(--color-border-light)] space-y-4">
            <h4 className="font-heading text-sm font-semibold text-[var(--color-ink)]">
              오행 보완
            </h4>
            <KkachiTip>
              한쪽에 부족한 오행을 상대가 가지고 있으면 서로를 채워주는 사이가 돼요. 반대로 같은 오행이 둘 다 강하면 충돌이 잦을 수 있어요.
            </KkachiTip>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ElementBar snapshot={pillar1_snapshot} label={`${name1}님`} />
              <ElementBar snapshot={pillar2_snapshot} label={`${name2}님`} />
            </div>

            <OhengPairDiagram
              p1={pillar1_snapshot}
              p2={pillar2_snapshot}
              name1={name1}
              name2={name2}
            />

            <div className="space-y-2">
              {element_complement.p2_provides.length > 0 && (
                <KkachiTip>
                  {name2}님이 {elementsToKor(element_complement.p2_provides)} 기운으로 {name1}님의 부족함을 채워줘요.
                </KkachiTip>
              )}
              {element_complement.p1_provides.length > 0 && (
                <KkachiTip>
                  {name1}님이 {elementsToKor(element_complement.p1_provides)} 기운으로 {name2}님의 부족함을 채워줘요.
                </KkachiTip>
              )}
              {element_complement.overlap_strong.length > 0 && (
                <KkachiTip>
                  두 분 모두 {elementsToKor(element_complement.overlap_strong)} 기운이 과중해 충돌이 생길 수 있어요.
                </KkachiTip>
              )}
              {element_complement.p1_provides.length === 0 &&
                element_complement.p2_provides.length === 0 &&
                element_complement.overlap_strong.length === 0 && (
                  <KkachiTip>오행 구성이 비슷한 균형 관계예요.</KkachiTip>
                )}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
