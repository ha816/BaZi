"use client";
import React, { useState } from "react";
import type { NatalResult, PostnatalResult } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";
import { ganjiKor, STEM_ELEMENT, BRANCH_ELEMENT } from "@/lib/ganji";
import CollapsibleSectionHeader from "@/components/CollapsibleSectionHeader";
import KkachiTip from "@/components/KkachiTip";
import OhengAnalysis from "@/components/OhengAnalysis";


const STEM_ORDER = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const BRANCH_ORDER = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];

interface Props {
  natal: NatalResult;
  postnatal: PostnatalResult;
  name?: string;
}

export default function YongshinTab({ natal, postnatal }: Props) {
  const [showYongshin, setShowYongshin] = useState(false);
  const yongshinInfo = getElementInfo(natal.yongshin_info.name);
  const kisinName = natal.kisin_info.name;
  const kisinInfo = kisinName ? getElementInfo(kisinName) : null;

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

      {/* 용신·기신 + 활용 가이드 */}
      <div className="slide-card">
        <CollapsibleSectionHeader title="용신·기신(用神·忌神)">
          <strong className="text-[var(--color-ink)]">용신(用神)</strong>은 사주 균형을 잡아 주는 가장 이로운 오행, <strong className="text-[var(--color-ink)]">기신(忌神)</strong>은 균형을 흐트리는 피할 오행이에요.
          용신은 <strong className="text-[var(--color-ink)]">색·방향·직업·습관</strong>으로 가까이 두고, 기신은 같은 영역에서 되도록 줄이는 게 좋아요.
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
