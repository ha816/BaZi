"use client";

import type { CompatibilityResult, PillarSnapshot } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";
import KkachiTip from "./KkachiTip";
import PillarPairDiagram from "./PillarPairDiagram";
import ScoreBar from "./ScoreBar";
import SectionHeader from "./SectionHeader";

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

const ELEMENTS_ORDER = ["木", "火", "土", "金", "水"];

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

export default function CompatibilityResultView({ data, name1, name2 }: Props) {
  const {
    total_score, label, domain_scores, description,
    pillar1_snapshot, pillar2_snapshot, pillar_relations, element_complement,
    shared_sinsal, unique_sinsal_1, unique_sinsal_2, samhap_completions, key_traits, narrative,
  } = data;

  return (
    <div className="space-y-4">
      {/* ── 1. 종합 점수 카드 ── */}
      <div className="slide-card">
        <div className="slide-card__header">
          <SectionHeader title="종합 궁합" noMargin />
        </div>
        <div className="divider" />
        <div className="slide-card__body space-y-5">
          <KkachiTip>
            {name1}님과 {name2}님은 <strong>{label}</strong>이에요. 카드를 하나씩 펼치며 두 분의 관계를 풀어드릴게요.
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
              <p className="text-xs text-[var(--color-ink-faint)]">{name1} × {name2}</p>
            </div>
          </div>

          {key_traits.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {key_traits.map((t) => (
                <span
                  key={t}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full border"
                  style={{ background: "var(--color-gold-faint)", color: "var(--color-gold)", borderColor: "var(--color-gold-light)" }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 2. 두 사주 비교 카드 ── */}
      {pillar1_snapshot && pillar2_snapshot && (
        <div className="slide-card">
          <div className="slide-card__header">
            <SectionHeader title="사주 한눈 비교" noMargin />
          </div>
          <div className="divider" />
          <div className="slide-card__body space-y-4">
            <KkachiTip>
              두 분의 사주팔자를 위·아래로 나란히 펼쳤어요. 같은 기둥끼리(年-年, 月-月, 日-日, 時-時) 만났을 때 일어나는 <strong>합·충·형·해·파·원진</strong>이 가운데 줄에 표시됩니다.
            </KkachiTip>

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
                          {name1} <strong>{c.p1_branches.join("")}</strong> + {name2} <strong>{c.p2_branches.join("")}</strong> → 운명적 호흡
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <PillarPairDiagram
              p1={pillar1_snapshot}
              p2={pillar2_snapshot}
              relations={pillar_relations}
              name1={name1}
              name2={name2}
            />
          </div>
        </div>
      )}

      {/* ── 3. 오행 보완 카드 ── */}
      {pillar1_snapshot && pillar2_snapshot && (
        <div className="slide-card">
          <div className="slide-card__header">
            <SectionHeader title="오행 보완" noMargin />
          </div>
          <div className="divider" />
          <div className="slide-card__body space-y-5">
            <KkachiTip>
              한쪽에 부족한 오행을 상대가 가지고 있으면 서로를 채워주는 사이가 돼요. 반대로 같은 오행이 둘 다 강하면 충돌이 잦을 수 있어요.
            </KkachiTip>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ElementBar snapshot={pillar1_snapshot} label={name1} />
              <ElementBar snapshot={pillar2_snapshot} label={name2} />
            </div>

            <div className="space-y-2 text-xs">
              {element_complement.p2_provides.length > 0 && (
                <p className="text-[var(--color-ink-muted)]">
                  · <strong className="text-[var(--color-ink)]">{name2}</strong>이(가) <strong className="text-emerald-700">{element_complement.p2_provides.join(", ")}</strong> 기운으로 <strong>{name1}</strong>의 부족함을 채워줘요
                </p>
              )}
              {element_complement.p1_provides.length > 0 && (
                <p className="text-[var(--color-ink-muted)]">
                  · <strong className="text-[var(--color-ink)]">{name1}</strong>이(가) <strong className="text-emerald-700">{element_complement.p1_provides.join(", ")}</strong> 기운으로 <strong>{name2}</strong>의 부족함을 채워줘요
                </p>
              )}
              {element_complement.overlap_strong.length > 0 && (
                <p className="text-[var(--color-fire)]">
                  · 두 분 모두 <strong>{element_complement.overlap_strong.join(", ")}</strong> 기운이 과중해 충돌이 생길 수 있어요
                </p>
              )}
              {element_complement.p1_provides.length === 0 &&
                element_complement.p2_provides.length === 0 &&
                element_complement.overlap_strong.length === 0 && (
                  <p className="text-[var(--color-ink-faint)]">· 오행 구성이 비슷한 균형 관계예요</p>
                )}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. 영역별 궁합 카드 ── */}
      <div className="slide-card">
        <div className="slide-card__header">
          <SectionHeader title="영역별 궁합" noMargin />
        </div>
        <div className="divider" />
        <div className="slide-card__body space-y-5">
          <KkachiTip>
            연애·결혼·재물·직업 네 영역 각각에서 두 분의 사주가 어떻게 상호작용하는지 점수와 근거로 풀어드릴게요.
          </KkachiTip>

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

      {/* ── 5. 공유 신살 카드 ── */}
      {(shared_sinsal.length > 0 || unique_sinsal_1.length > 0 || unique_sinsal_2.length > 0) && (
        <div className="slide-card">
          <div className="slide-card__header">
            <SectionHeader title="공유·고유 신살" noMargin />
          </div>
          <div className="divider" />
          <div className="slide-card__body space-y-4">
            <KkachiTip>
              <strong>신살(神殺)</strong>은 사주에 깃든 특별한 기운이에요. 같은 신살을 공유하면 코드가 맞고, 한쪽만 가지면 그 영역에서 도움을 줄 수 있어요.
            </KkachiTip>

            {shared_sinsal.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[var(--color-ink-muted)]">함께 가진 신살</p>
                <div className="flex flex-wrap gap-1.5">
                  {shared_sinsal.map((s) => (
                    <span
                      key={s}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full border"
                      style={{ background: "#dcfce7", color: "#15803d", borderColor: "#86efac" }}
                    >
                      ★ {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unique_sinsal_1.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-[var(--color-ink-muted)]">{name1}만 가진 신살</p>
                  <div className="flex flex-wrap gap-1.5">
                    {unique_sinsal_1.map((s) => (
                      <span
                        key={s}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full border"
                        style={{ background: "var(--color-ivory)", color: "var(--color-ink-muted)", borderColor: "var(--color-border-light)" }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {unique_sinsal_2.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-[var(--color-ink-muted)]">{name2}만 가진 신살</p>
                  <div className="flex flex-wrap gap-1.5">
                    {unique_sinsal_2.map((s) => (
                      <span
                        key={s}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full border"
                        style={{ background: "var(--color-ivory)", color: "var(--color-ink-muted)", borderColor: "var(--color-border-light)" }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 6. AI 해석 카드 ── */}
      {narrative && (
        <div className="slide-card">
          <div className="slide-card__header">
            <SectionHeader title="까치의 종합 해석" noMargin />
          </div>
          <div className="divider" />
          <div className="slide-card__body space-y-3">
            <KkachiTip>
              앞에서 본 데이터를 까치가 한 편의 글로 정리했어요. 강점·약점·실천 조언이 담겨 있어요.
            </KkachiTip>
            <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed whitespace-pre-line">
              {narrative}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
