"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { AnalysisResult, NatalResult } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";
import NatalTab from "./tabs/NatalTab";
import YongshinTab from "./tabs/YongshinTab";
import DaeunTab from "./tabs/DaeunTab";
import SeunTab from "./tabs/SeunTab";
import FortuneTab from "./tabs/FortuneTab";
import SamjaeTab from "./tabs/SamjaeTab";
import AdviceTab from "./tabs/AdviceTab";
import ZodiacTab from "./tabs/ZodiacTab";
import FengShuiTab from "./tabs/FengShuiTab";
import { postFeedback } from "@/lib/api";

const PILLAR_LABEL_KOR = ["년", "월", "일", "시"];

function StickySajuBar({ natal }: { natal: NatalResult }) {
  const meInfo = getElementInfo(natal.my_element.name);
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="w-full"
      aria-label="페이지 맨 위로"
    >
      <div className="flex items-center justify-center gap-2.5 rounded-lg px-3 py-1.5 bg-[var(--color-card)] border border-[var(--color-border-light)]">
        {[3, 2, 1, 0].map((i) => {
          const pillar = natal.pillars[i] ?? "";
          const isDay = i === 2;
          return (
            <div key={i} className="flex flex-col items-center">
              <span className="text-[8px] font-semibold mb-0.5"
                style={{ color: isDay ? meInfo.color : "var(--color-ink-faint)" }}>
                {PILLAR_LABEL_KOR[i]}
              </span>
              <div className="flex flex-col items-center px-1.5 py-0.5 rounded"
                style={isDay
                  ? { backgroundColor: meInfo.bgColor, border: `1px solid ${meInfo.borderColor}` }
                  : undefined}>
                <span className="font-heading text-[13px] font-bold leading-none"
                  style={{ color: isDay ? meInfo.color : "var(--color-ink-muted)" }}>
                  {pillar[0] ?? ""}
                </span>
                <span className="font-heading text-[13px] leading-none mt-1"
                  style={{ color: isDay ? meInfo.color : "var(--color-ink-muted)" }}>
                  {pillar[1] ?? ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </button>
  );
}

const FEATURE_TABS = [
  { id: "natal",    emoji: "🌱", label: "만세력" },
  { id: "yongshin", emoji: "🔮", label: "용신·삼재" },
  { id: "daeun",    emoji: "🌊", label: "대운&세운" },
  { id: "zodiac",   emoji: "🐾", label: "십이지신" },
  { id: "fengshui", emoji: "🧭", label: "풍수" },
  { id: "advice",   emoji: "💬", label: "종합조언" },
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
      <div className="sticky top-0 z-30 bg-[var(--color-ivory)] -mx-4 px-4 pt-2 space-y-1.5">
        <StickySajuBar natal={natal} />
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
        {active === "natal"   && <NatalTab       {...tabProps} />}
        {active === "zodiac"  && <ZodiacTab      {...tabProps} />}
        {active === "daeun"   && (
          <div className="space-y-4">
            <DaeunTab {...tabProps} />
            <SeunTab {...tabProps} />
            <FortuneTab {...tabProps} />
          </div>
        )}
        {active === "yongshin" && (
          <div className="space-y-4">
            <YongshinTab {...tabProps} />
            <SamjaeTab {...tabProps} />
          </div>
        )}
        {active === "advice"   && <AdviceTab      {...tabProps} />}
        {active === "fengshui" && <FengShuiTab    natal={natal} name={name} />}

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
