"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { CompatibilityResult, RelationType } from "@/types/analysis";
import { type DailyCompat } from "@/lib/api";
import { track } from "@/lib/track";
import DailyTab from "./compatibility/DailyTab";
import DomainTab from "./compatibility/DomainTab";
import ElementTab from "./compatibility/ElementTab";
import NarrativeTab from "./compatibility/NarrativeTab";
import PillarsTab from "./compatibility/PillarsTab";
import SinsalTab from "./compatibility/SinsalTab";
import TotalTab from "./compatibility/TotalTab";

interface Props {
  data: CompatibilityResult;
  name1: string;
  name2: string;
  relationType: RelationType;
  /** 셋 다 있을 때만(프로필×2) "오늘의 궁합" 탭을 보인다 — page.tsx가 제출 시점에 스냅샷한 값 */
  memberId?: string;
  profileId1?: string;
  profileId2?: string;
  streamingNarrative?: string;
  narrativeLoading?: boolean;
}

// 순서 = 노출 순서. 라벨은 그리드 폭 때문에 한자 없이 짧게(한자 병기는 각 카드 제목에). 탭바 포맷은 ResultSlides와 동일(globals.css .feature-tabbar)
const COMPAT_TABS = [
  { id: "total",   emoji: "💞", label: "종합" },
  { id: "pillars", emoji: "🧩", label: "팔자 나란히" },
  { id: "element", emoji: "🌗", label: "오행 보완" },
  { id: "sinsal",  emoji: "⭐", label: "신살 만남" },
  { id: "domain",  emoji: "📊", label: "영역별" },
  { id: "daily",   emoji: "🌅", label: "오늘의 궁합" },   // 프로필×2일 때만 (canDaily)
  { id: "ai",      emoji: "✨", label: "AI 해석" },
] as const;
type CompatTabId = (typeof COMPAT_TABS)[number]["id"];

/** 궁합 결과 오케스트레이터 — 탭 정의·?tab=·탭바만. 본문은 compatibility/ 탭 파일 */
export default function CompatibilityResultView({ data, name1, name2, relationType, memberId, profileId1, profileId2, streamingNarrative, narrativeLoading }: Props) {
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
  const canDaily = !!memberId && !!profileId1 && !!profileId2;
  const tabs = canDaily ? COMPAT_TABS : COMPAT_TABS.filter((t) => t.id !== "daily");
  const tab: CompatTabId = tabs.find((t) => t.id === tabParam)?.id ?? "total";   // ?tab=daily + 직접 입력 → total
  const [daily, setDaily] = useState<DailyCompat | null>(null);
  const setTab = (id: CompatTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    track("tab_view", { tab, page: "compat", has_profile: canDaily });
  }, [tab, canDaily]);

  const tabProps = { data: safe, name1, name2, relationType };

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-30 bg-[var(--color-ivory)] -mx-4 px-4 pt-2">
        <div className={`feature-tabbar ${tabs.length === 7 ? "feature-tabbar--7" : ""}`}>
          {tabs.map((t) => (
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
      {tab === "pillars" && <PillarsTab {...tabProps} />}
      {tab === "element" && <ElementTab {...tabProps} />}
      {tab === "sinsal" && <SinsalTab {...tabProps} />}
      {tab === "domain" && <DomainTab {...tabProps} />}
      {tab === "daily" && memberId && profileId1 && profileId2 && (
        <DailyTab memberId={memberId} profileId1={profileId1} profileId2={profileId2} name1={name1} name2={name2} daily={daily} onLoaded={setDaily} />
      )}
      {tab === "ai" && (
        <NarrativeTab narrative={safe.narrative} streamingNarrative={streamingNarrative} narrativeLoading={narrativeLoading} />
      )}
    </div>
  );
}
