"use client";

import type { ReactNode } from "react";
import type { NatalResult } from "@/types/analysis";
import PillarSection from "./natal/PillarSection";
import StrengthSection from "./natal/StrengthSection";
import SipsinSection from "./natal/SipsinSection";
import JizanganSection from "./natal/JizanganSection";
import GongmangSection from "./natal/GongmangSection";

interface Props {
  natal: NatalResult;
  name: string;
  /** 신강·신약 바로 아래 — 나의 캐릭터 카드(ResultSlides가 natal.character 있을 때 넘긴다) */
  afterStrength?: ReactNode;
}

// 만세력 — 팔자·신강신약·(나의 캐릭터)·십신·지장간·공망. 십이운성·신살은 운성·신살 탭(EnergyTab)으로 분리.
export default function NatalTab({ natal, afterStrength }: Props) {
  return (
    <div className="space-y-4">
      <PillarSection natal={natal} />
      <StrengthSection natal={natal} />
      {afterStrength}
      {natal.sipsin.length > 0 && <SipsinSection natal={natal} />}
      {natal.jizan_gan?.some((jg) => jg.length > 0) && <JizanganSection natal={natal} />}
      {natal.gongmang?.some(Boolean) && <GongmangSection natal={natal} />}
    </div>
  );
}
