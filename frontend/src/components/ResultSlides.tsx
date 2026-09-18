"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { AnalysisResult } from "@/types/analysis";
import NatalTab from "./tabs/NatalTab";
import YongshinTab from "./tabs/YongshinTab";
import WolUnTab from "./tabs/WolUnTab";
import DaeunTab from "./tabs/DaeunTab";
import SeunTab from "./tabs/SeunTab";
import FortuneTab from "./tabs/FortuneTab";
import SamjaeTab from "./tabs/SamjaeTab";
import AiTab from "./tabs/AiTab";
import ZodiacTab from "./tabs/ZodiacTab";
import FengShuiTab from "./tabs/FengShuiTab";
import TimingTab from "./tabs/TimingTab";
import EnergyTab from "./tabs/EnergyTab";
import DomainFortuneSection from "./tabs/DomainFortuneSection";
import SajuChat from "./SajuChat";
import SummaryCard from "./SummaryCard";
import { postFeedback } from "@/lib/api";
import { track } from "@/lib/track";

// 한 줄에 6개까지, 넘으면 아랫줄로 (globals.css .feature-tabbar). 순서 = 노출 순서.
const FEATURE_TABS = [
  { id: "summary",  emoji: "🐦", label: "한눈에" },
  { id: "natal",    emoji: "🌱", label: "만세력" },
  { id: "energy",   emoji: "⭐", label: "신살·운성" },
  { id: "yongshin", emoji: "🔮", label: "용신·삼재" },
  { id: "timing",   emoji: "🗓️", label: "택시(擇時)" },
  { id: "daeun",    emoji: "🌊", label: "시운(時運)" },
  { id: "zodiac",   emoji: "🐾", label: "십이지신" },
  { id: "fengshui", emoji: "🧭", label: "풍수" },
  { id: "ai",       emoji: "✨", label: "AI 풀이" },
] as const;

type FeatureId = typeof FEATURE_TABS[number]["id"];

interface Props {
  data: AnalysisResult;
  name: string;
  memberId?: string;
  profileId?: string;
}

function FeedbackBar({
  tabId,
  memberId,
  profileId,
}: {
  tabId: string;
  memberId?: string;
  profileId?: string;
}) {
  const [submitted, setSubmitted] = useState(false);

  const handleRate = async (rating: number) => {
    if (!memberId || !profileId) return;
    setSubmitted(true);
    try {
      await postFeedback(memberId, profileId, tabId, rating);
    } catch {
      // fire-and-forget: 실패해도 UX 차단하지 않음
    }
  };

  return (
    <div className="mt-8 border-t border-[var(--color-border)] pt-6 text-center space-y-3">
      <p className="text-sm text-[var(--color-text-muted)]">이 해석이 도움이 됐나요?</p>
      {submitted ? (
        <p className="text-sm font-medium text-[var(--color-accent)]">감사합니다!</p>
      ) : (
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => handleRate(1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--color-border)] text-sm hover:bg-[var(--color-surface)] transition-colors"
          >
            <span>👍</span>
            <span>잘 맞아요</span>
          </button>
          <button
            type="button"
            onClick={() => handleRate(0)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--color-border)] text-sm hover:bg-[var(--color-surface)] transition-colors"
          >
            <span>👎</span>
            <span>별로예요</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function ResultSlides({ data, name, memberId, profileId }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = searchParams.get("tab");
  const active: FeatureId = (FEATURE_TABS.find((t) => t.id === tabParam)?.id) ?? "summary";

  useEffect(() => {
    track("tab_view", { tab: active, has_profile: !!profileId });
  }, [active, profileId]);

  useEffect(() => {
    track("result_view", { has_profile: !!profileId });
  }, [profileId]);

  const handleTabChange = (id: FeatureId) => {
    router.replace(`${pathname}?tab=${id}`, { scroll: false });
  };

  const { natal, postnatal } = data;
  const tabProps = { natal, postnatal, name };

  return (
    <div className="space-y-4">
      {natal.hour_unknown && (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-ivory-warm)] px-4 py-3 text-xs leading-relaxed text-[var(--color-ink-muted)]">
          <span className="font-semibold text-[var(--color-ink)]">🕰️ 출생시간을 몰라 세 기둥(三柱), 여섯 글자로 봤어요.</span>{" "}
          시주(時柱)가 빠져 자녀·말년 영역은 보이지 않고, 대운 시작 나이는 ±2개월 오차가 있을 수 있어요. 시간을 알게 되면 프로필에서 고쳐 주세요.
        </div>
      )}
      <div className="sticky top-0 z-30 bg-[var(--color-ivory)] -mx-4 px-4 pt-2">
        <div className="feature-tabbar">
          {FEATURE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`feature-tab ${active === tab.id ? "feature-tab--active" : ""}`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        {active === "summary" && postnatal.summary && (
          <SummaryCard summary={postnatal.summary} hasProfile={!!profileId} onNavigate={(t) => handleTabChange(t as FeatureId)} />
        )}
        {active === "timing"  && (
          <div className="space-y-4">
            <TimingTab {...tabProps} />
            <DomainFortuneSection postnatal={postnatal} />
          </div>
        )}
        {active === "natal"   && <NatalTab       {...tabProps} />}
        {active === "energy"  && <EnergyTab      {...tabProps} />}
        {active === "zodiac"  && <ZodiacTab      {...tabProps} />}
        {active === "daeun"   && (
          <div className="space-y-4">
            <DaeunTab {...tabProps} />
            <SeunTab {...tabProps} />
            <WolUnTab {...tabProps} />
            <FortuneTab {...tabProps} />
          </div>
        )}
        {active === "yongshin" && (
          <div className="space-y-4">
            <YongshinTab {...tabProps} />
            <SamjaeTab {...tabProps} />
          </div>
        )}
        {active === "ai"       && <AiTab           {...tabProps} />}
        {active === "fengshui" && <FengShuiTab    natal={natal} name={name} />}

        <FeedbackBar
          key={`${active}:${profileId ?? ""}`}
          tabId={active}
          memberId={memberId}
          profileId={profileId}
        />
      </div>

      <SajuChat />
    </div>
  );
}
