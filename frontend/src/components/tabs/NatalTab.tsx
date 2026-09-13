"use client";

import type { NatalResult } from "@/types/analysis";
import PillarSection from "./natal/PillarSection";
import SipsinSection from "./natal/SipsinSection";
import JizanganSection from "./natal/JizanganSection";
import GongmangSection from "./natal/GongmangSection";

interface Props {
  natal: NatalResult;
  name: string;
}

// 만세력 — 팔자·십신·지장간·공망. 십이운성·신살은 운성·신살 탭(EnergyTab)으로 분리.
export default function NatalTab({ natal }: Props) {
  return (
    <div className="space-y-4">
      <PillarSection natal={natal} />
      {natal.sipsin.length > 0 && <SipsinSection natal={natal} />}
      {natal.jizan_gan?.some((jg) => jg.length > 0) && <JizanganSection natal={natal} />}
      {natal.gongmang?.some(Boolean) && <GongmangSection natal={natal} />}
    </div>
  );
}
