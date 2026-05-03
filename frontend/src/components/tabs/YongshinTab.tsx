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

const STRENGTH_DESC: Record<string, string> = {
  "신강(身強)": "일간의 기운이 강한 편이에요. 에너지를 쏟을 방향을 잘 고르는 게 중요해요.",
  "신약(身弱)": "일간의 기운이 약한 편이에요. 나를 지지해주는 환경과 사람을 잘 고르면 훨씬 잘 발휘돼요.",
  "중화(中和)": "일간의 기운이 균형 잡힌 상태예요. 폭넓은 환경에서 두루 안정적인 성과를 낼 수 있는 타입입니다.",
};

const STEM_READING: Record<string, string> = {
  甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무",
  己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
};

const STEM_ORDER = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const BRANCH_ORDER = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];

const STEM_ELEMENT: Record<string, string> = {
  甲:"木",乙:"木",丙:"火",丁:"火",戊:"土",己:"土",庚:"金",辛:"金",壬:"水",癸:"水",
};
const BRANCH_ELEMENT: Record<string, string> = {
  子:"水",丑:"土",寅:"木",卯:"木",辰:"土",巳:"火",午:"火",未:"土",申:"金",酉:"金",戌:"土",亥:"水",
};

// 기신(忌神): 용신을 剋하는 오행
const KISIN_MAP: Record<string, string> = {
  木: "金", 火: "水", 土: "木", 金: "火", 水: "土",
};

const YONGSHIN_GUIDE: Record<string, { color: string; direction: string; career: string; daily: string }> = {
  木: { color: "초록·청록",   direction: "동쪽",   career: "교육·출판·디자인·환경", daily: "식물·나무 가구·산책" },
  火: { color: "빨강·주황",   direction: "남쪽",   career: "엔터테인먼트·언론·요식·뷰티", daily: "햇빛·캔들·운동" },
  土: { color: "노랑·갈색",   direction: "중앙",   career: "부동산·중개·농업·신뢰업", daily: "도자기·황토·정원 가꾸기" },
  金: { color: "흰색·은색",   direction: "서쪽",   career: "금융·법무·기계·의료",   daily: "금속 액세서리·정돈된 환경" },
  水: { color: "검정·남색",   direction: "북쪽",   career: "IT·연구·유통·물 관련", daily: "수족관·물·명상" },
};

interface Props {
  natal: NatalResult;
  postnatal: PostnatalResult;
  name?: string;
}

export default function YongshinTab({ natal, postnatal, name = "" }: Props) {
  const [showYongshin, setShowYongshin] = useState(false);
  const meInfo = getElementInfo(natal.my_element.name);
  const yongshinInfo = getElementInfo(natal.yongshin_info.name);
  const kisinName = KISIN_MAP[natal.yongshin_info.name];
  const kisinInfo = kisinName ? getElementInfo(kisinName) : null;
  const guide = YONGSHIN_GUIDE[natal.yongshin_info.name];
  const strengthText = STRENGTH_DESC[natal.strength_label] ?? STRENGTH_DESC["중화(中和)"];
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
    { ...makeYear(0), label: "올해" },
    { ...makeYear(1), label: "내년" },
    ...(nearestYongshinOffset !== null && nearestYongshinOffset !== 0 && nearestYongshinOffset !== 1
      ? [{ ...makeYear(nearestYongshinOffset), label: "가장 가까운 용신의 해" as string | null }]
      : []),
  ];

  return (
    <div className="space-y-4">
      {/* 오행(五行) — 분포·관계 */}
      <OhengAnalysis natal={natal} />

      {/* 신강·신약 */}
      <div className="slide-card">
        <CollapsibleSectionHeader title="신강·신약(身強·身弱)">
          나의 일간(日干) <strong className="text-[var(--color-ink)]">{STEM_READING[natal.day_stem] ?? natal.day_stem}({natal.day_stem})</strong>가 사주 전체에서 얼마나 힘 있는지 보여주는 척도예요.
          <strong className="text-[var(--color-ink)]"> 신강</strong>이면 자기 주도적인 추진력이, <strong className="text-[var(--color-ink)]">신약</strong>이면 환경·사람의 도움을 활용하는 흐름이 두드러집니다. 강약을 알아야 어떤 오행이 용신인지 정해져요.
        </CollapsibleSectionHeader>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
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
          <KkachiTip>{strengthText}</KkachiTip>
        </div>
      </div>

      {/* 용신·기신 */}
      <div className="slide-card">
        <CollapsibleSectionHeader title="용신·기신(用神·忌神)">
          <strong className="text-[var(--color-ink)]">용신(用神)</strong>은 사주의 균형을 잡아주어 나에게 가장 이로운 오행이고, <strong className="text-[var(--color-ink)]">기신(忌神)</strong>은 그 균형을 흐트리는, 가능하면 피해야 할 오행이에요.
          용신이 강한 해(年)나 환경에 들어가면 운이 잘 풀리고, 일상에서 색·방향·습관으로 용신을 가까이 두면 좋습니다.
        </CollapsibleSectionHeader>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
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
                  <span className="text-[10px] font-semibold" style={{ color: yongshinInfo.color }}>✨ 용신(用神)</span>
                  <span className="font-heading text-5xl font-bold leading-none" style={{ color: yongshinInfo.color }}>
                    {natal.yongshin_info.name}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: yongshinInfo.color }}>
                    {yongshinInfo.korean}
                  </span>
                </div>
                {kisinInfo && (
                  <div
                    className="rounded-2xl p-4 flex flex-col items-center gap-1.5"
                    style={{ backgroundColor: kisinInfo.bgColor, border: `1.5px solid ${kisinInfo.borderColor}`, opacity: 0.7 }}
                  >
                    <span className="text-[10px] font-semibold" style={{ color: kisinInfo.color }}>⚠️ 기신(忌神)</span>
                    <span className="font-heading text-5xl font-bold leading-none" style={{ color: kisinInfo.color }}>
                      {kisinName}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: kisinInfo.color }}>
                      {kisinInfo.korean}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed text-center px-2">
                {natal.yongshin_info.meaning}
              </p>

              {/* 올해 · 내년 · 가장 가까운 용신의 해 */}
              <div className={`grid gap-2 ${yearItems.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
                {yearItems.map(({ year, ganji, stemEl, branchEl, matchesYongshin, label }) => {
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
                      {label && <span className="text-[10px] font-semibold text-[var(--color-ink-faint)]">{label}</span>}
                      <span className="text-[10px] font-semibold text-[var(--color-ink-faint)]">{year}</span>
                      <span className="font-heading text-lg font-bold text-[var(--color-ink)]">{ganji}</span>
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
                          ★ 용신 기운
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 활용 가이드 */}
      {showYongshin && guide && (
        <div className="slide-card">
          <CollapsibleSectionHeader title="활용 가이드">
            용신 오행을 일상의 <strong className="text-[var(--color-ink)]">색·방향·직업·습관</strong>으로 끌어와 가까이 두면 흐름이 부드러워져요. 기신은 같은 영역에서 가능한 줄이는 게 좋습니다.
          </CollapsibleSectionHeader>
          <div className="divider" />
          <div className="slide-card__body space-y-2.5">
            <div className="rounded-lg p-3"
              style={{ backgroundColor: yongshinInfo.bgColor, border: `1px solid ${yongshinInfo.borderColor}` }}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-base">✨</span>
                <span className="text-xs font-bold" style={{ color: yongshinInfo.color }}>
                  {yongshinInfo.korean}({natal.yongshin_info.name}) — 용신 활용
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                <div className="flex gap-1.5"><span className="text-[var(--color-ink-faint)] min-w-[36px]">색깔</span><strong className="text-[var(--color-ink)]">{guide.color}</strong></div>
                <div className="flex gap-1.5"><span className="text-[var(--color-ink-faint)] min-w-[36px]">방향</span><strong className="text-[var(--color-ink)]">{guide.direction}</strong></div>
                <div className="flex gap-1.5 col-span-2"><span className="text-[var(--color-ink-faint)] min-w-[36px]">직업</span><strong className="text-[var(--color-ink)]">{guide.career}</strong></div>
                <div className="flex gap-1.5 col-span-2"><span className="text-[var(--color-ink-faint)] min-w-[36px]">일상</span><strong className="text-[var(--color-ink)]">{guide.daily}</strong></div>
              </div>
            </div>
            {kisinInfo && kisinName && YONGSHIN_GUIDE[kisinName] && (
              <div className="rounded-lg p-3"
                style={{ backgroundColor: kisinInfo.bgColor, border: `1px solid ${kisinInfo.borderColor}`, opacity: 0.85 }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-base">⚠️</span>
                  <span className="text-xs font-bold" style={{ color: kisinInfo.color }}>
                    {kisinInfo.korean}({kisinName}) — 기신 (가능하면 줄이기)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                  <div className="flex gap-1.5"><span className="text-[var(--color-ink-faint)] min-w-[36px]">색깔</span><strong className="text-[var(--color-ink)]">{YONGSHIN_GUIDE[kisinName].color}</strong></div>
                  <div className="flex gap-1.5"><span className="text-[var(--color-ink-faint)] min-w-[36px]">방향</span><strong className="text-[var(--color-ink)]">{YONGSHIN_GUIDE[kisinName].direction}</strong></div>
                </div>
              </div>
            )}
            <KkachiTip>
              {meInfo.korean}({natal.my_element.name}) 일간인 {STEM_READING[natal.day_stem]}({natal.day_stem})는 {natal.strength_label}으로, <strong className="text-[var(--color-ink)]">{yongshinInfo.korean}({natal.yongshin_info.name})</strong> 기운이 가장 잘 도와줘요. 위 색·방향·습관을 일상에 한 가지씩만 들여도 운의 결이 달라집니다.
            </KkachiTip>
          </div>
        </div>
      )}
    </div>
  );
}
