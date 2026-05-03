"use client";
import React, { useState } from "react";
import type { NatalResult, PostnatalResult } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";
import CollapsibleSectionHeader from "@/components/CollapsibleSectionHeader";
import KkachiTip from "@/components/KkachiTip";
import OhengAnalysis from "@/components/OhengAnalysis";

const STRENGTH_MAX = 8;

const STRENGTH_IMG: Record<string, string> = {
  "신강(身強)": "/kkachi/strength/신강.png",
  "신약(身弱)": "/kkachi/strength/신약.png",
};

const STEM_ORDER = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const BRANCH_ORDER = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];

const STEM_ELEMENT: Record<string, string> = {
  甲:"木",乙:"木",丙:"火",丁:"火",戊:"土",己:"土",庚:"金",辛:"金",壬:"水",癸:"水",
};
const BRANCH_ELEMENT: Record<string, string> = {
  子:"水",丑:"土",寅:"木",卯:"木",辰:"土",巳:"火",午:"火",未:"土",申:"金",酉:"金",戌:"土",亥:"水",
};

const STEM_KOR: Record<string, string> = {
  甲:"갑", 乙:"을", 丙:"병", 丁:"정", 戊:"무",
  己:"기", 庚:"경", 辛:"신", 壬:"임", 癸:"계",
};
const BRANCH_KOR: Record<string, string> = {
  子:"자", 丑:"축", 寅:"인", 卯:"묘", 辰:"진", 巳:"사",
  午:"오", 未:"미", 申:"신", 酉:"유", 戌:"술", 亥:"해",
};

function ganjiKor(ganji: string): string {
  const s = STEM_KOR[ganji[0]] ?? ganji[0];
  const b = BRANCH_KOR[ganji[1]] ?? ganji[1];
  return `${s}${b}(${ganji})`;
}

interface Props {
  natal: NatalResult;
  postnatal: PostnatalResult;
  name?: string;
}

export default function YongshinTab({ natal, postnatal }: Props) {
  const [showYongshin, setShowYongshin] = useState(false);
  const [showStrength, setShowStrength] = useState(false);
  const yongshinInfo = getElementInfo(natal.yongshin_info.name);
  const kisinName = natal.kisin_info.name;
  const kisinInfo = kisinName ? getElementInfo(kisinName) : null;
  const guide = natal.yongshin_guide;
  const strengthPct = Math.min(100, Math.max(0, 50 + (natal.strength_value / STRENGTH_MAX) * 50));
  const strengthColor =
    natal.strength_label === "신강(身強)"
      ? "var(--color-fire)"
      : natal.strength_label === "신약(身弱)"
      ? "var(--color-water)"
      : "var(--color-earth)";

  const seunStemIdx = STEM_ORDER.indexOf(postnatal.seun_ganji[0]);
  const seunBranchIdx = BRANCH_ORDER.indexOf(postnatal.seun_ganji[1]);

  const makeYear = (offset: number) => {
    const stem = STEM_ORDER[(seunStemIdx + offset) % 10];
    const branch = BRANCH_ORDER[(seunBranchIdx + offset) % 12];
    const stemEl = STEM_ELEMENT[stem] ?? "";
    const branchEl = BRANCH_ELEMENT[branch] ?? "";
    return {
      year: postnatal.year + offset,
      ganji: stem + branch,
      stemEl, branchEl,
      matchesYongshin: stemEl === natal.yongshin_info.name || branchEl === natal.yongshin_info.name,
    };
  };

  const nearestYongshinYear = postnatal.nearest_yongshin_year;
  const nearestYongshinOffset = nearestYongshinYear != null ? nearestYongshinYear - postnatal.year : null;

  const yearItems = [
    makeYear(0),
    makeYear(1),
    makeYear(2),
    ...(nearestYongshinOffset !== null && nearestYongshinOffset > 2
      ? [makeYear(nearestYongshinOffset)]
      : []),
  ];

  return (
    <div className="space-y-4">
      {/* 오행(五行) — 분포·관계 */}
      <OhengAnalysis natal={natal} />

      {/* 신강·신약 */}
      <div className="slide-card">
        <CollapsibleSectionHeader title="신강·신약(身強·身弱)">
          나의 일간(日干) <strong className="text-[var(--color-ink)]">{natal.day_stem_korean}({natal.day_stem})</strong>가 사주 전체에서 얼마나 힘 있는지 보여주는 척도예요.
          <strong className="text-[var(--color-ink)]"> 신강</strong>이면 자기 주도적인 추진력이, <strong className="text-[var(--color-ink)]">신약</strong>이면 환경·사람의 도움을 활용하는 흐름이 두드러집니다. 강약을 알아야 어떤 오행이 용신인지 정해져요.
        </CollapsibleSectionHeader>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          <KkachiTip>
            나의 타고난 기운(<strong className="text-[var(--color-ink)]">{natal.day_stem_korean}({natal.day_stem})</strong>)이 사주 안에서 얼마나 영향력 있는지 점수로 보여드릴게요. 신강이면 자기 페이스로 밀고 가는 힘이, 신약이면 환경·사람과 함께 펼쳐지는 결이 두드러져요.
          </KkachiTip>
          {!showStrength ? (
            <button
              onClick={() => setShowStrength(true)}
              className="btn-shimmer w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:opacity-70"
            >
              ✨ 나의 신강·신약 확인하기
            </button>
          ) : (
            <>
              <div>
                <div className="relative h-3 rounded-full overflow-hidden bg-[var(--color-parchment)]">
                  <div className="absolute left-1/2 top-0 h-full w-0.5 bg-[var(--color-border-light)] z-10" />
                  <div
                    className="absolute top-0 h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.abs(strengthPct - 50)}%`,
                      left: strengthPct >= 50 ? "50%" : `${strengthPct}%`,
                      backgroundColor: strengthColor,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] mt-1.5">
                  <span className="text-[var(--color-water)]">신약(身弱) −8</span>
                  <span className="font-semibold" style={{ color: strengthColor }}>
                    {natal.strength_value > 0 ? `+${natal.strength_value}` : natal.strength_value} · {natal.strength_label}
                  </span>
                  <span className="text-[var(--color-fire)]">+8 신강(身強)</span>
                </div>
              </div>

              <img
                src={STRENGTH_IMG[natal.strength_label] ?? "/kkachi/normal_kkachi_00.png"}
                alt={natal.strength_label}
                className="w-1/2 mx-auto block rounded-xl object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = "/kkachi/normal_kkachi_00.png"; }}
              />
              <KkachiTip>{natal.narratives.strength_tip}</KkachiTip>
            </>
          )}
        </div>
      </div>

      {/* 용신·기신 + 활용 가이드 */}
      <div className="slide-card">
        <CollapsibleSectionHeader title="용신·기신(用神·忌神)">
          <strong className="text-[var(--color-ink)]">용신(用神)</strong>은 사주 균형을 잡아주어 나에게 가장 이로운 오행, <strong className="text-[var(--color-ink)]">기신(忌神)</strong>은 그 균형을 흐트리는 피해야 할 오행이에요.
          용신을 일상의 <strong className="text-[var(--color-ink)]">색·방향·직업·습관</strong>으로 끌어와 가까이 두면 운의 결이 부드러워지고, 기신은 같은 영역에서 가능한 줄이는 게 좋습니다.
        </CollapsibleSectionHeader>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          <KkachiTip>
            누구나 이상하게 잘 풀리는 시기와 왠지 꼬이는 시기가 있죠. 그 차이를 만드는 기운이 <strong className="text-[var(--color-ink)]">용신(用神)</strong>과 <strong className="text-[var(--color-ink)]">기신(忌神)</strong>이에요 — 용신을 가까이 두면 흐름이 부드러워지고, 기신과는 거리를 두면 한결 가벼워져요.
          </KkachiTip>
          {!showYongshin ? (
            <button
              onClick={() => setShowYongshin(true)}
              className="btn-shimmer w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:opacity-70"
            >
              ✨ 나의 용신·기신 확인하기
            </button>
          ) : (
            <>
              {/* 용신 / 기신 큰 카드 가로 배치 */}
              <div className="grid grid-cols-2 gap-2">
                <div
                  className="animate-glow-pulse rounded-2xl p-4 flex flex-col items-center gap-1.5"
                  style={{ backgroundColor: yongshinInfo.bgColor, border: `2px solid ${yongshinInfo.borderColor}`, "--glow-color": yongshinInfo.borderColor } as React.CSSProperties}
                >
                  <span className="text-[10px] font-semibold" style={{ color: yongshinInfo.color }}>용신(用神)</span>
                  <span className="font-heading text-5xl font-bold leading-none" style={{ color: yongshinInfo.color }}>
                    {natal.yongshin_info.name}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: yongshinInfo.color }}>
                    {yongshinInfo.korean}
                  </span>
                </div>
                {kisinInfo && (
                  <div
                    className="animate-glow-pulse rounded-2xl p-4 flex flex-col items-center gap-1.5"
                    style={{ backgroundColor: kisinInfo.bgColor, border: `1.5px solid ${kisinInfo.borderColor}`, opacity: 0.7, animationDelay: "1.8s", "--glow-color": kisinInfo.borderColor } as React.CSSProperties}
                  >
                    <span className="text-[10px] font-semibold" style={{ color: kisinInfo.color }}>기신(忌神)</span>
                    <span className="font-heading text-5xl font-bold leading-none" style={{ color: kisinInfo.color }}>
                      {kisinName}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: kisinInfo.color }}>
                      {kisinInfo.korean}
                    </span>
                  </div>
                )}
              </div>

              {/* 이번달부터 6개월 — 용신 달 표시 */}
              {postnatal.upcoming_months?.length > 0 && (
                <div className="grid grid-cols-6 gap-1">
                    {postnatal.upcoming_months.map((m) => {
                      const stemElInfo = getElementInfo(m.stem_element);
                      const branchElInfo = getElementInfo(m.branch_element);
                      return (
                        <div key={`${m.year}-${m.month}`}
                          className="flex flex-col items-center gap-1 rounded-lg p-1.5 border"
                          style={{
                            borderColor: m.matches_yongshin ? yongshinInfo.borderColor : "var(--color-border-light)",
                            backgroundColor: m.matches_yongshin ? yongshinInfo.bgColor : "var(--color-card)",
                          }}>
                          <span className="text-[10px] font-semibold text-[var(--color-ink-light)]">
                            {m.month}월
                          </span>
                          <span className="font-heading text-[10px] font-bold text-[var(--color-ink)] text-center leading-tight">
                            {ganjiKor(m.ganji)}
                          </span>
                          <div className="flex gap-0.5">
                            <span className="text-[9px] px-1 py-0 rounded-full font-medium"
                              style={{ color: stemElInfo.color, backgroundColor: stemElInfo.bgColor }}>
                              {stemElInfo.korean}
                            </span>
                            <span className="text-[9px] px-1 py-0 rounded-full font-medium"
                              style={{ color: branchElInfo.color, backgroundColor: branchElInfo.bgColor }}>
                              {branchElInfo.korean}
                            </span>
                          </div>
                          {m.matches_yongshin && (
                            <span className="text-[9px] font-bold whitespace-nowrap" style={{ color: yongshinInfo.color }}>
                              ★ 용신
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* 올해 · 내년 · 내후년 · 가장 가까운 용신의 해 */}
              <div className={`grid gap-2 ${yearItems.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
                {yearItems.map(({ year, ganji, stemEl, branchEl, matchesYongshin }) => {
                  const stemElInfo = getElementInfo(stemEl);
                  const branchElInfo = getElementInfo(branchEl);
                  return (
                    <div
                      key={year}
                      className="flex flex-col items-center gap-1.5 rounded-xl p-3 border"
                      style={{
                        borderColor: matchesYongshin ? yongshinInfo.borderColor : "var(--color-border-light)",
                        backgroundColor: matchesYongshin ? yongshinInfo.bgColor : "var(--color-surface)",
                      }}
                    >
                      <span className="text-[10px] font-semibold text-[var(--color-ink-light)]">{year}</span>
                      <span className="font-heading text-xs font-bold text-[var(--color-ink)] text-center">{ganjiKor(ganji)}</span>
                      <div className="flex gap-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ color: stemElInfo.color, backgroundColor: stemElInfo.bgColor }}>
                          {stemElInfo.korean}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ color: branchElInfo.color, backgroundColor: branchElInfo.bgColor }}>
                          {branchElInfo.korean}
                        </span>
                      </div>
                      {matchesYongshin && (
                        <span className="text-[10px] font-bold" style={{ color: yongshinInfo.color }}>
                          ★ 용신
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <KkachiTip>{natal.narratives.yongshin_tip}</KkachiTip>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
