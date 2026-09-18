"use client";

import { useState } from "react";
import { useStorageValue } from "@/lib/useStorageValue";
import type { NatalResult } from "@/types/analysis";
import KkachiTip from "@/components/KkachiTip";
import { SIPSIN_INFO, SIPSIN_CATEGORIES } from "./data";

interface Props {
  natal: NatalResult;
}

export default function SipsinSection({ natal }: Props) {
  const stored = useStorageValue("kkachi_concept_sipsin");
  const [override, setOverride] = useState<boolean | null>(null);
  const sipsinOpen = override ?? stored === "open";

  const toggleSipsin = () => {
    const next = !sipsinOpen;
    setOverride(next);
    localStorage.setItem("kkachi_concept_sipsin", next ? "open" : "closed");
  };

  const dayKor = natal.day_stem_korean || natal.day_stem;
  const last = dayKor[dayKor.length - 1].charCodeAt(0);
  const hasJongseong = last >= 0xAC00 && last <= 0xD7A3 && (last - 0xAC00) % 28 !== 0;

  const grouped = natal.sipsin.reduce<Record<string, { sipsin_name: string; chars: string[]; element: string; count: number }>>(
    (acc, s) => {
      if (!acc[s.sipsin_name]) acc[s.sipsin_name] = { sipsin_name: s.sipsin_name, chars: [], element: s.element, count: 0 };
      acc[s.sipsin_name].chars.push(s.char);
      acc[s.sipsin_name].count++;
      return acc;
    }, {}
  );

  const ordered: { sipsinName: string; cat: typeof SIPSIN_CATEGORIES[number] }[] = [];
  for (const cat of SIPSIN_CATEGORIES) {
    for (const m of cat.members) {
      if (grouped[m]) ordered.push({ sipsinName: m, cat });
    }
  }

  return (
    <div className="slide-card">
      <div className="slide-card__header" style={sipsinOpen ? { paddingBottom: 14 } : undefined}>
        <div className="flex items-center gap-2">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">십신(十神)</h3>
          <button type="button" onClick={toggleSipsin} className="text-[10px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink-muted)] transition-colors flex items-center gap-0.5">
            상세 설명 <span>{sipsinOpen ? "▲" : "▼"}</span>
          </button>
        </div>
        {sipsinOpen && (
          <div className="text-xs text-[var(--color-ink-muted)] leading-relaxed mt-2 space-y-2">
            <p>
              나를 뜻하는 일간(日干)의 <strong className="text-[var(--color-ink)]">{dayKor}({natal.day_stem})</strong>{hasJongseong ? "과" : "와"} 나머지 7글자가 어떤 관계인지 10가지로 분류한 체계예요. 재산·권위·관계를 대하는 방식 등 <strong className="text-[var(--color-ink)]">나만의 사회적 패턴</strong>을 보여줍니다.
            </p>
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-[var(--color-ink-muted)]">사회적 관계 오분류</p>
              <div className="space-y-2">
                {SIPSIN_CATEGORIES.map((cat) => (
                  <div key={cat.label} className="rounded-md p-2.5"
                    style={{ backgroundColor: cat.bg, border: `1px solid ${cat.color}40` }}>
                    <div className="text-xs font-bold leading-tight mb-1" style={{ color: cat.color }}>
                      {cat.label}({cat.hanja})
                    </div>
                    <p className="text-[11px] text-[var(--color-ink-muted)] leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="divider" />
      <div className="slide-card__body space-y-4">
        <KkachiTip>
          나의 일간인 <strong className="text-[var(--color-ink)]">{dayKor}({natal.day_stem})</strong>{hasJongseong ? "이" : "가"} 사주의 다른 글자와 맺는 <strong className="text-[var(--color-ink)]">10가지 관계</strong>를 자아·출력·재물·권위·입력 <strong className="text-[var(--color-ink)]">5가지</strong>로 묶어 나의 사회적 관계를 보여주는 체계예요.
        </KkachiTip>
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-2">
            {ordered.map(({ sipsinName, cat }) => {
              const group = grouped[sipsinName];
              const info = SIPSIN_INFO[sipsinName];
              return (
                <div key={sipsinName} className="rounded-lg overflow-hidden flex flex-col"
                  style={{ backgroundColor: cat.bg, border: `1.5px solid ${cat.color}40` }}>
                  <img
                    src={`/kkachi/sipsin/sipsin_${info?.korean ?? sipsinName}.png`}
                    alt={info?.korean ?? sipsinName}
                    className="w-full object-cover"
                    style={{ height: 160 }}
                    onError={(e) => { (e.target as HTMLImageElement).src = "/kkachi/normal_kkachi_00.png"; }}
                  />
                  <div className="p-2.5 flex-1">
                    <div className="text-[9px] font-semibold mb-1" style={{ color: cat.color }}>
                      {cat.label}({cat.hanja}) - {cat.keyword}
                    </div>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <p className="font-heading text-sm font-bold leading-snug text-[var(--color-ink)]">
                        {info?.korean ?? sipsinName}({sipsinName})
                        {info?.tagline && <span className="ml-1">— {info.tagline}</span>}
                      </p>
                      {group.count > 1 && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.color + "20", color: cat.color, border: `1px solid ${cat.color}60` }}>
                          ×{group.count}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[var(--color-ink-faint)] leading-snug">{info?.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <KkachiTip>{natal.narratives.sipsin_story}</KkachiTip>
      </div>
    </div>
  );
}
