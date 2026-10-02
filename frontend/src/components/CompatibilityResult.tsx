"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CompatibilityResult } from "@/types/analysis";
import DomainTab from "./compatibility/DomainTab";
import NarrativeTab from "./compatibility/NarrativeTab";
import TotalTab from "./compatibility/TotalTab";

interface Props {
  data: CompatibilityResult;
  name1: string;
  name2: string;
  streamingNarrative?: string;
  narrativeLoading?: boolean;
}

// 순서 = 노출 순서. 탭바 포맷은 ResultSlides와 동일(globals.css .feature-tabbar)
const COMPAT_TABS = [
  { id: "total", emoji: "💞", label: "종합 궁합" },
  { id: "domain", emoji: "📊", label: "영역별 궁합" },
  { id: "ai", emoji: "✨", label: "까치 AI 종합 해석" },
] as const;
type CompatTabId = (typeof COMPAT_TABS)[number]["id"];

/** 궁합 결과 오케스트레이터 — 탭 정의·?tab=·탭바만. 본문은 compatibility/ 탭 파일 */
export default function CompatibilityResultView({ data, name1, name2, streamingNarrative, narrativeLoading }: Props) {
  // 신규 필드는 이전 캐시(JSONB)에 없을 수 있으므로 안전한 기본값을 여기서 한 번만 채운다
  const safe: CompatibilityResult = {
    ...data,
    pillar1_snapshot: data.pillar1_snapshot ?? null,
    pillar2_snapshot: data.pillar2_snapshot ?? null,
    pillar_relations: data.pillar_relations ?? [],
    element_complement: data.element_complement ?? { p1_lacks: [], p1_provides: [], p2_lacks: [], p2_provides: [], overlap_strong: [], score: 0 },
    shared_sinsal: data.shared_sinsal ?? [],
    unique_sinsal_1: data.unique_sinsal_1 ?? [],
    unique_sinsal_2: data.unique_sinsal_2 ?? [],
    samhap_completions: data.samhap_completions ?? [],
    key_traits: data.key_traits ?? [],
    narrative: data.narrative ?? null,
  };

  // 탭은 ResultSlides처럼 ?tab= 에 둔다 (invite·p1·p2 등 다른 파라미터는 유지)
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabParam = searchParams.get("tab");
  const tab: CompatTabId = COMPAT_TABS.find((t) => t.id === tabParam)?.id ?? "total";
  const setTab = (id: CompatTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const tabProps = { data: safe, name1, name2 };

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-30 bg-[var(--color-ivory)] -mx-4 px-4 pt-2">
        <div className="feature-tabbar">
          {COMPAT_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`feature-tab ${tab === t.id ? "feature-tab--active" : ""}`}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {tab === "total" && <TotalTab {...tabProps} />}
      {tab === "domain" && <DomainTab {...tabProps} />}
      {tab === "ai" && (
        <NarrativeTab narrative={safe.narrative} streamingNarrative={streamingNarrative} narrativeLoading={narrativeLoading} />
      )}
    </div>
  );
}
