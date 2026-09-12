"use client";

import { useState } from "react";
import type { NatalResult } from "@/types/analysis";
import KkachiTip from "@/components/KkachiTip";
import CollapsibleSectionHeader from "@/components/CollapsibleSectionHeader";
import { SIPSIN_INFO, PILLAR_LABELS_SHORT } from "./data";

interface Props {
  natal: NatalResult;
}

export default function JizanganSection({ natal }: Props) {
  const pillarIdx = natal.hour_unknown ? [2, 1, 0] : [3, 2, 1, 0];
  const [bonkiOpen, setBonkiOpen] = useState(false);

  const heavenlyStems = natal.pillars.map((p) => p[0]);
  const dayJg = natal.jizan_gan[2] ?? [];
  const bonki = dayJg[dayJg.length - 1];

  return (
    <div className="slide-card">
      <CollapsibleSectionHeader title="지장간(地藏干)">
        사주의 아래 글자(지지)는 한 달짜리 시간이에요. 그 안에서 여러 천간이 시간대별로 돌아가며 작동하는 게 지장간(地藏干, 땅에 감춰진 천간)이에요. 겉엔 잘 안 보여도 결정적인 순간 작동하는 <strong className="text-[var(--color-ink)]">잠재된 기운과 속마음</strong>을 보여줍니다. 본기·중기·여기 3단계로 비중이 다르며, 일지(日支) 본기는 <strong className="text-[var(--color-ink)]">자신의 진짜 욕구</strong>를 나타냅니다.
      </CollapsibleSectionHeader>
      <div className="divider" />
      <div className="slide-card__body space-y-4">
        <KkachiTip>
          지장간을 보면 <strong className="text-[var(--color-ink)]">본심과 겉 모습</strong>이 같은지 다른지 파악해 볼 수 있어요. 지장간이 사주천간 중 하나라도 같다면 <strong className="text-[var(--color-ink)]">투출(透出)</strong>이라고 하고, <strong className="text-[var(--color-ink)]">속과 겉이 일치하는 상태</strong>를 뜻해요.
        </KkachiTip>
        {!bonkiOpen ? (
          <button
            type="button"
            onClick={() => setBonkiOpen(true)}
            className="btn-shimmer w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:opacity-70"
          >
            ✨ 나의 겉과 속 일치 파악하기
          </button>
        ) : (
          <>
            {bonki && (() => {
              const info = SIPSIN_INFO[bonki.sipsin_name];
              const kor = info?.korean ?? bonki.sipsin_name;
              const stemKor = bonki.stem_korean || bonki.stem;
              const exposed = heavenlyStems.includes(bonki.stem);
              return (
                <>
                  <div className="rounded-xl p-4 space-y-3"
                    style={{ border: "1.5px solid var(--color-gold-light)", backgroundColor: "var(--color-gold-faint)" }}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-[var(--color-gold)]">일지(日支) 본기</span>
                    </div>
                    <div className="flex items-center gap-3.5">
                      <div className="relative flex flex-col items-center justify-center w-16 h-16 rounded-xl flex-shrink-0"
                        style={{ backgroundColor: "var(--color-card)", border: "1.5px solid var(--color-gold-light)" }}>
                        <span className="font-heading text-2xl font-bold text-[var(--color-ink)] leading-none">{bonki.stem}</span>
                        <span className="text-[10px] text-[var(--color-ink-faint)] mt-0.5">{stemKor}</span>
                        {exposed && (
                          <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: "var(--color-gold)", color: "var(--color-ivory)" }}>
                            透
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-sm font-bold text-[var(--color-ink)]">
                          {kor}<span className="text-[11px] font-normal text-[var(--color-ink-faint)] ml-1">({bonki.sipsin_name})</span>
                        </p>
                        {info && (
                          <>
                            <p className="text-xs font-medium text-[var(--color-gold)]">{info.tagline}</p>
                            <p className="text-[11px] text-[var(--color-ink-muted)] leading-snug">{info.desc}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <KkachiTip>
                    {exposed
                      ? `사주천간 중 ${stemKor}(${bonki.stem})와 일치하여 투출되어 있어요. 속과 겉이 일치하는 솔직한 타입입니다.`
                      : `천간에는 드러나지 않은 깊은 욕구예요. 평소엔 잘 보이지 않지만, 결정의 순간 강하게 작용하는 진짜 본심입니다.`}
                  </KkachiTip>
                </>
              );
            })()}

            <div>
              <div className="rounded-xl border border-[var(--color-border-light)] overflow-hidden">
                <table className="w-full text-center border-collapse" style={{ tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: "72px" }} />
                    {pillarIdx.map((i) => <col key={i} />)}
                  </colgroup>
                  <thead>
                    <tr style={{ backgroundColor: "var(--color-ivory)" }}>
                      <th className="text-[10px] font-medium text-[var(--color-ink-faint)] py-1.5 px-2"></th>
                      {pillarIdx.map((origI) => {
                        const isDayPillar = origI === 2;
                        return (
                          <th key={origI} className="text-[10px] font-semibold py-1.5 px-2"
                            style={{
                              color: isDayPillar ? "var(--color-gold)" : "var(--color-ink-muted)",
                              backgroundColor: isDayPillar ? "var(--color-gold-faint)" : undefined,
                            }}>
                            {PILLAR_LABELS_SHORT[origI]}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {(["여기", "중기", "본기"] as const).map((role) => {
                      const roleHanja = natal.jizan_gan
                        .flat()
                        .find((it) => it.role === role)?.role_hanja ?? "";
                      return (
                        <tr key={role} className="border-t border-[var(--color-border-light)]">
                          <td className="text-[10px] py-2 px-2 whitespace-nowrap text-left"
                            style={role === "본기"
                              ? { color: "var(--color-gold)", fontWeight: 700 }
                              : { color: "var(--color-ink-faint)" }}>
                            {role}{roleHanja && `(${roleHanja})`}
                          </td>
                          {pillarIdx.map((origI) => {
                            const item = natal.jizan_gan[origI]?.find((it) => it.role === role);
                            const isDayPillar = origI === 2;
                            const isExposed = !!item && heavenlyStems.includes(item.stem);
                            const isBonki = role === "본기";
                            return (
                              <td key={origI} className="py-2 px-2"
                                style={{ backgroundColor: isDayPillar ? "var(--color-gold-faint)" : undefined }}>
                                {item ? (
                                  <div className="space-y-0.5">
                                    <div className={`font-heading leading-tight ${isBonki ? "text-base font-bold" : "text-xs"}`}
                                      style={{ color: isExposed ? "var(--color-gold)" : (isBonki ? "var(--color-ink)" : "var(--color-ink-muted)") }}>
                                      {item.stem}
                                      {isExposed && (
                                        <span className="inline-block rounded-full align-top ml-0.5"
                                          style={{ width: 3, height: 3, backgroundColor: "currentColor" }} />
                                      )}
                                    </div>
                                    <div className="text-[9px] text-[var(--color-ink-faint)] leading-tight">
                                      {SIPSIN_INFO[item.sipsin_name]?.korean ?? item.sipsin_name} · {item.weight}%
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-[var(--color-ink-faint)]">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-[var(--color-ink-faint)] mt-1.5 leading-relaxed">
                <span className="inline-block rounded-full align-middle"
                  style={{ width: 4, height: 4, backgroundColor: "var(--color-gold)" }} /> 표시는 지장간이 천간(天干)과 같은 <strong className="text-[var(--color-ink-muted)]">투출(透干)</strong>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
