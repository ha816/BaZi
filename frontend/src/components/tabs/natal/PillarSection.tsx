"use client";

import { useState, useEffect } from "react";
import type { NatalResult } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";
import PillarDetail from "@/components/PillarDetail";
import SectionHeader from "@/components/SectionHeader";
import KkachiTip from "@/components/KkachiTip";
import { STEM_PROFILE } from "./data";

interface Props {
  natal: NatalResult;
}

export default function PillarSection({ natal }: Props) {
  const meInfo = getElementInfo(natal.my_element.name);
  const [sajuOpen, setSajuOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("kkachi_concept_saju") === "open") setSajuOpen(true);
  }, []);

  const toggleSaju = () => {
    const next = !sajuOpen;
    setSajuOpen(next);
    localStorage.setItem("kkachi_concept_saju", next ? "open" : "closed");
  };

  const stemProfile = STEM_PROFILE[natal.day_stem] ?? STEM_PROFILE["甲"];
  const stemKor = natal.day_stem_korean;

  return (
    <div className="slide-card">
      <div className="slide-card__header" style={sajuOpen ? { paddingBottom: 6 } : undefined}>
        <div className="flex items-center gap-2">
          <SectionHeader title="사주팔자(四柱八字)" noMargin />
          <button type="button" onClick={toggleSaju} className="text-[10px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink-muted)] transition-colors flex items-center gap-0.5">
            상세 설명 <span>{sajuOpen ? "▲" : "▼"}</span>
          </button>
        </div>
        {sajuOpen && (
          <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed mt-2">
            태어난 <strong className="text-[var(--color-ink)]">연·월·일·시</strong>를 각각 하늘(천간)과 땅(지지) 두 글자로 표현한 것이 <strong className="text-[var(--color-ink)]">사주(四柱)</strong>, 그 여덟 글자를 <strong className="text-[var(--color-ink)]">팔자(八字)</strong>예요. 그 중 태어난 날의 천간(日干)이 <strong className="text-[var(--color-ink)]">나 자신</strong>을 상징하며, 사주 전체가 이 일간을 중심으로 풀이됩니다.
          </p>
        )}
      </div>
      <div className="divider" />
      <div className="slide-card__body space-y-4">
        <KkachiTip>
          사주의 4기둥 8글자가 펼쳐지는 큰 지도예요. 위쪽 천간(天干)은 마음·뜻을, 아래쪽 지지(地支)는 환경·시간을 나타내요. 그 중 일주의 천간(日干)이 바로 나 자신입니다.
        </KkachiTip>

        <PillarDetail pillars={natal.pillars} dayStem={natal.day_stem} basic />

        <div className="rounded-xl p-4 space-y-3 border border-[var(--color-border-light)]"
          style={{ backgroundColor: "var(--color-card)" }}>
          <p className="text-xs font-semibold text-[var(--color-ink-muted)] text-center">
            일간(日干) 심상(心象)
          </p>
          <img
            src={`/kkachi/sipgan/십간_${stemKor}.png`}
            alt=""
            className="w-4/5 mx-auto block aspect-[3/2] rounded-2xl object-cover"
            style={{ backgroundColor: "var(--color-card)" }}
            onError={(e) => { (e.target as HTMLImageElement).src = "/kkachi/normal_kkachi_00.png"; }}
          />
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="font-heading font-bold leading-snug text-[var(--color-ink)]">
              <span className="text-3xl mr-1" style={{ color: meInfo.color }}>
                {stemKor || natal.day_stem}({natal.day_stem})
              </span>
              <span className="text-lg">- {stemProfile.tagline}</span>
            </p>
            <div className="flex flex-wrap gap-1 justify-center">
              {stemProfile.keywords.map((kw) => (
                <span
                  key={kw}
                  className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
                  style={{ color: meInfo.color, borderColor: meInfo.borderColor, backgroundColor: meInfo.bgColor }}
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>

        <KkachiTip>{stemProfile.hint}</KkachiTip>
      </div>
    </div>
  );
}
