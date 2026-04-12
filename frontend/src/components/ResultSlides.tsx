"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { AnalysisResult } from "@/types/analysis";
import NatalTab from "./tabs/NatalTab";
import PersonalityTab from "./tabs/PersonalityTab";
import DaeunTab from "./tabs/DaeunTab";
import RelationshipTab from "./tabs/RelationshipTab";
import AdviceTab from "./tabs/AdviceTab";
import ZodiacTab from "./tabs/ZodiacTab";
import { postFeedback } from "@/lib/api";

const FEATURE_TABS = [
  { id: "natal",        emoji: "🌱", label: "사주팔자" },
  { id: "ki",           emoji: "✨", label: "기운" },
  { id: "zodiac",       emoji: "🐾", label: "십이지신" },
  { id: "daeun",        emoji: "🌊", label: "대운·세운" },
  { id: "relationship", emoji: "🤝", label: "인간관계" },
  { id: "advice",       emoji: "💬", label: "종합조언" },
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
  const active: FeatureId = (FEATURE_TABS.find((t) => t.id === tabParam)?.id) ?? "natal";

  const [feedbackKey, setFeedbackKey] = useState(0);

  useEffect(() => {
    setFeedbackKey((k) => k + 1);
  }, [active]);

  const handleTabChange = (id: FeatureId) => {
    router.replace(`${pathname}?tab=${id}`, { scroll: false });
  };

  const { natal, postnatal } = data;
  const tabProps = { natal, postnatal, name };

  return (
    <div className="space-y-4">
      <div className="feature-tabbar sticky top-0 z-30 bg-[var(--color-ivory)] -mx-4 px-4 pt-2">
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

      <div>
        {active === "natal"        && <NatalTab        {...tabProps} />}
        {active === "ki"           && <PersonalityTab  {...tabProps} />}
{active === "daeun"        && <DaeunTab        {...tabProps} />}
        {active === "relationship" && <RelationshipTab {...tabProps} />}
        {active === "advice"       && <AdviceTab       {...tabProps} />}
        {active === "zodiac"       && <ZodiacTab       {...tabProps} />}

        <FeedbackBar
          key={feedbackKey}
          tabId={active}
          memberId={memberId}
          profileId={profileId}
        />
      </div>
    </div>
  );
}
