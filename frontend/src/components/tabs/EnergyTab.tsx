"use client";

import type { NatalResult } from "@/types/analysis";
import SibiUnseongSection from "./natal/SibiUnseongSection";
import SinsalSection from "./natal/SinsalSection";

interface Props {
  natal: NatalResult;
  name: string;
}

// 신살·운성 — 십이신살·신살 + 십이운성(운의 성쇠). 만세력에서 분리.
export default function EnergyTab({ natal }: Props) {
  const hasUnseong = natal.sibi_unseong.length > 0;
  const hasSinsal = natal.sibi_sinsal?.some(Boolean) || natal.sinsal.length > 0;
  if (!hasUnseong && !hasSinsal) return null;
  return (
    <div className="space-y-4">
      {hasSinsal && <SinsalSection natal={natal} />}
      {hasUnseong && <SibiUnseongSection natal={natal} />}
    </div>
  );
}
