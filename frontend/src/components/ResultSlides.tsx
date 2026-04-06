"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/types/analysis";
import NatalTab from "./tabs/NatalTab";
import PersonalityTab from "./tabs/PersonalityTab";
import FortuneTab from "./tabs/FortuneTab";
import DaeunTab from "./tabs/DaeunTab";
import RelationshipTab from "./tabs/RelationshipTab";
import AdviceTab from "./tabs/AdviceTab";
import ZodiacTab from "./tabs/ZodiacTab";

const FEATURE_TABS = [
  { id: "natal",        emoji: "🌱", label: "사주팔자" },
  { id: "personality",  emoji: "✨", label: "성격분석" },
  { id: "fortune",      emoji: "⭐", label: "올해운세" },
  { id: "daeun",        emoji: "🌊", label: "대운흐름" },
  { id: "relationship", emoji: "🤝", label: "인간관계" },
  { id: "advice",       emoji: "💬", label: "종합조언" },
  { id: "zodiac",       emoji: "🐉", label: "12지신" },
] as const;

type FeatureId = typeof FEATURE_TABS[number]["id"];

interface Props {
  data: AnalysisResult;
  name: string;
}

export default function ResultSlides({ data, name }: Props) {
  const [active, setActive] = useState<FeatureId>("natal");
  const { natal, postnatal } = data;
  const tabProps = { natal, postnatal, name };

  return (
    <div className="space-y-4">
      <div className="feature-tabbar sticky top-0 z-30 bg-[var(--color-ivory)] -mx-4 px-4 pt-2">
        {FEATURE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`feature-tab ${active === tab.id ? "feature-tab--active" : ""}`}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div>
        {active === "natal"        && <NatalTab        {...tabProps} />}
        {active === "personality"  && <PersonalityTab  {...tabProps} />}
        {active === "fortune"      && <FortuneTab      {...tabProps} />}
        {active === "daeun"        && <DaeunTab        {...tabProps} />}
        {active === "relationship" && <RelationshipTab {...tabProps} />}
        {active === "advice"       && <AdviceTab       {...tabProps} />}
        {active === "zodiac"       && <ZodiacTab       {...tabProps} />}
      </div>
    </div>
  );
}
