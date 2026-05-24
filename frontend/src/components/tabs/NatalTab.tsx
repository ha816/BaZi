"use client";

import type { NatalResult } from "@/types/analysis";
import PillarSection from "./natal/PillarSection";
import SipsinSection from "./natal/SipsinSection";
import JizanganSection from "./natal/JizanganSection";
import GongmangSection from "./natal/GongmangSection";
import SibiUnseongSection from "./natal/SibiUnseongSection";
import SinsalSection from "./natal/SinsalSection";

interface Props {
  natal: NatalResult;
  name: string;
}

export default function NatalTab({ natal }: Props) {
  return (
    <div className="space-y-4">
      <PillarSection natal={natal} />
      {natal.sipsin.length > 0 && <SipsinSection natal={natal} />}
      {natal.jizan_gan?.some((jg) => jg.length > 0) && <JizanganSection natal={natal} />}
      {natal.gongmang?.some(Boolean) && <GongmangSection natal={natal} />}
      {natal.sibi_unseong.length > 0 && <SibiUnseongSection natal={natal} />}
      {(natal.sibi_sinsal?.some(Boolean) || natal.sinsal.length > 0) && <SinsalSection natal={natal} />}
    </div>
  );
}
