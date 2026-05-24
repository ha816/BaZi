"use client";

import type { NatalResult } from "@/types/analysis";
import KkachiTip from "@/components/KkachiTip";
import CollapsibleSectionHeader from "@/components/CollapsibleSectionHeader";
import { SIBI_SINSAL_INFO, SINSAL_INFO, SINSAL_ORDER, SINSAL_COMBOS, PILLAR_LABELS_SHORT } from "./data";

interface Props {
  natal: NatalResult;
}

export default function SinsalSection({ natal }: Props) {
  const myMap = natal.sinsal.reduce<Record<string, string[]>>((acc, s) => {
    if (!acc[s.sinsal_korean]) acc[s.sinsal_korean] = [];
    acc[s.sinsal_korean].push(s.branch);
    return acc;
  }, {});
  const mySet = new Set(Object.keys(myMap));
  const activeCombo = SINSAL_COMBOS.find((c) => c.needs.every((n) => mySet.has(n)));
  const hasBaekho = mySet.has("백호살");

  const hasSibiSinsal = natal.sibi_sinsal?.some(Boolean);
  const hasSpecialSinsal = natal.sinsal.length > 0;

  return (
    <div className="slide-card">
      <CollapsibleSectionHeader title="신살(神殺)">
        옛날엔 길흉을 가르는 길신(神)·흉살(殺)로 봤지만, 현대에는 <strong className="text-[var(--color-ink)]">개인의 독특한 역량과 캐릭터</strong>로 풀이합니다.
      </CollapsibleSectionHeader>
      <div className="divider" />
      <div className="slide-card__body space-y-4">
        <KkachiTip>
          신살은 옛날엔 길흉으로 봤지만 현대에는 <strong className="text-[var(--color-ink)]">개인의 특성·역량</strong>으로 풀이합니다.
        </KkachiTip>

        {hasSibiSinsal && (
          <div className="space-y-3">
            <p className="text-[10px] font-semibold text-[var(--color-ink-muted)]">십이신살(十二神殺)</p>
            <div className="grid grid-cols-4 gap-2">
              {[3, 2, 1, 0].map((origI) => {
                const sinsalName = natal.sibi_sinsal[origI] || "";
                const info = SIBI_SINSAL_INFO[sinsalName];
                return (
                  <div key={origI} className="rounded-xl border text-center px-2 py-2 space-y-1"
                    style={{ borderColor: "var(--color-border-light)", backgroundColor: "var(--color-card)" }}>
                    <div className="text-[10px] text-[var(--color-ink-faint)]">{PILLAR_LABELS_SHORT[origI]}</div>
                    {sinsalName ? (
                      <>
                        <div className="text-sm font-semibold text-[var(--color-ink)] leading-tight">
                          {sinsalName}
                          {info && <span className="text-[9px] font-normal text-[var(--color-ink-faint)] ml-0.5">({info.hanja})</span>}
                        </div>
                        {info && (
                          <div className="text-[9px] text-[var(--color-ink-faint)] leading-snug">{info.meaning}</div>
                        )}
                      </>
                    ) : <div className="text-sm font-semibold text-[var(--color-ink-faint)]">—</div>}
                  </div>
                );
              })}
            </div>
            <KkachiTip>{natal.narratives.sibi_sinsal_story}</KkachiTip>
          </div>
        )}

        {hasSpecialSinsal && (
          <>
            {hasSibiSinsal && (
              <p className="text-[10px] font-semibold text-[var(--color-ink-muted)]">특수신살</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {SINSAL_ORDER.filter((n) => !!myMap[n]).map((sinsalName) => {
                const info = SINSAL_INFO[sinsalName];
                return (
                  <div key={sinsalName} className="rounded-xl p-3 border overflow-hidden" style={{ backgroundColor: info.bg, borderColor: info.border }}>
                    <p className="font-heading text-sm font-bold text-[var(--color-ink)]">
                      {sinsalName}
                      <span className="text-[10px] font-normal text-[var(--color-ink-faint)] ml-1">{info.hanja}</span>
                    </p>
                    <p className="text-xs text-[var(--color-ink-faint)] leading-snug mt-1">{info.tagline} — {info.desc}</p>
                    <img
                      src={`/kkachi/sinsal/sinsal_${sinsalName}.png`}
                      alt={sinsalName}
                      className="w-full rounded-lg object-cover mt-2"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/kkachi/normal_kkachi_00.png"; }}
                    />
                  </div>
                );
              })}
            </div>
            {hasBaekho && (
              <KkachiTip>
                백호살은 무서운 게 아니에요! 에너지가 워낙 강해서 생기는 일들이니, 이 힘을 전문적인 업무나 강한 집중력이 필요한 곳에 쏟아보세요. 외과의사, 운동선수, 소방관처럼 강도 높은 환경에서 오히려 두각을 나타내는 기운이에요.
              </KkachiTip>
            )}
            {activeCombo && <KkachiTip>{activeCombo.message}</KkachiTip>}
            {!hasBaekho && !activeCombo && <KkachiTip>{natal.narratives.sinsal_narrative}</KkachiTip>}
          </>
        )}
      </div>
    </div>
  );
}
