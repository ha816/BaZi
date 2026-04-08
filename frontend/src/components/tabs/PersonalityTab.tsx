"use client";
import React, { useState } from "react";
import type { NatalResult, PostnatalResult } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";
import SectionHeader from "@/components/SectionHeader";
import KkachiTip from "@/components/KkachiTip";

const YANG_STEMS = new Set(["甲", "丙", "戊", "庚", "壬"]);
const STRENGTH_MAX = 8;
const ELEMENT_ORDER = ["木", "火", "土", "金", "水"] as const;

const STEM_ELEMENT: Record<string, string> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土",
  己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
};
const BRANCH_ELEMENT: Record<string, string> = {
  子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火",
  午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水",
};
const PILLAR_LABELS_SHORT = ["年", "月", "日", "時"];
const PILLAR_LABELS_KO = ["해", "달", "날", "시"];
const STEM_ORDER = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const BRANCH_ORDER = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];

const STEM_READING: Record<string, string> = {
  甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무",
  己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
};

const STEM_PROFILE: Record<string, { nickname: string; tagline: string; keywords: string[]; hint: string }> = {
  "甲": { nickname: "개척자",  tagline: "처음 길을 내는 큰 나무",     keywords: ["도전", "리더십", "직진본능", "자존심"],   hint: "고집이 세 보일 수 있지만, 그 뚝심이 당신의 가장 큰 무기예요." },
  "乙": { nickname: "전략가",  tagline: "어디서든 살아남는 덩굴",      keywords: ["유연함", "친화력", "적응력", "눈치"],      hint: "부드럽게 감아 올라가는 덩굴처럼 관계와 환경을 내 편으로 만드는 능력이 있어요." },
  "丙": { nickname: "태양",    tagline: "주변을 환히 밝히는 불꽃",    keywords: ["열정", "존재감", "솔직함", "에너지"],      hint: "어딜 가도 존재감이 넘쳐요. 무대 위에 서면 더욱 빛나는 타입입니다." },
  "丁": { nickname: "촛불",    tagline: "섬세하게 타오르는 빛",        keywords: ["섬세함", "집중력", "감수성", "예리함"],    hint: "겉으론 조용해 보여도 속에 깊은 열정이 있어요. 집중할 때의 몰입력이 대단합니다." },
  "戊": { nickname: "산",      tagline: "흔들리지 않는 큰 땅",         keywords: ["포용력", "신뢰", "묵직함", "책임감"],      hint: "사람들이 본능적으로 기대고 싶어하는 타입이에요. 그 무게를 즐기세요." },
  "己": { nickname: "정원사",  tagline: "모든 것을 품는 기름진 밭",    keywords: ["세심함", "배려", "꼼꼼함", "현실감각"],    hint: "디테일에 강하고 사람을 잘 챙겨요. 그 섬세한 감각이 큰 자산입니다." },
  "庚": { nickname: "검객",    tagline: "단번에 베어내는 강철",         keywords: ["결단력", "원칙", "추진력", "강직함"],      hint: "망설임 없는 결단력이 강점이에요. 때로는 부드러운 접근도 더 효과적일 수 있어요." },
  "辛": { nickname: "보석",    tagline: "갈고 닦여 빛나는 금속",        keywords: ["완벽주의", "심미안", "자존감", "날카로움"], hint: "스스로의 기준이 높은 편이에요. 그 높은 기준이 당신을 특별하게 만들어줘요." },
  "壬": { nickname: "바다",    tagline: "모든 것을 담는 큰 물",         keywords: ["통찰력", "지략", "포용", "사유"],          hint: "큰 그림을 보는 전략적 사고가 뛰어나요. 흐름을 읽는 능력을 믿으세요." },
  "癸": { nickname: "빗물",    tagline: "조용히 스며드는 지혜",         keywords: ["직관", "감성", "배려", "내면의 힘"],       hint: "겉으로 드러나지 않는 깊은 감수성과 직관이 있어요. 혼자만의 시간이 에너지를 충전해줘요." },
};

const OHENG_PERSONALITY: Record<string, { keywords: string[]; excess: string; lack: string }> = {
  "木": { keywords: ["성장", "리더십", "도전"],    excess: "주도적이고 앞장서는 성향이 강하게 나타나요.",    lack: "추진력과 새로운 도전을 더 믿어도 좋아요." },
  "火": { keywords: ["열정", "표현력", "솔직함"],  excess: "감정 표현이 풍부하고 에너지가 넘쳐요.",         lack: "활력과 솔직한 표현을 더 드러내도 좋아요." },
  "土": { keywords: ["안정", "포용", "현실감각"],  excess: "안정과 신뢰감이 탁월하지만 변화에 유연해지면 좋아요.", lack: "안정감과 인내심을 의식적으로 기르면 좋아요." },
  "金": { keywords: ["결단력", "원칙", "집중"],    excess: "원칙이 강하고 냉철하지만 때로는 유연함이 필요해요.", lack: "결단력과 집중력을 더 발휘할 여지가 있어요." },
  "水": { keywords: ["지혜", "유연함", "직관"],    excess: "지략이 뛰어나고 적응력이 강해요.",              lack: "직관과 유연함을 더 믿어도 좋아요." },
};

const STRENGTH_IMG: Record<string, string> = {
  "신강(身強)": "/kkachi/신강.png",
  "신약(身弱)": "/kkachi/신약.png",
};

const STRENGTH_DESC: Record<string, { icon: string; desc: string }> = {
  "신강(身強)": { icon: "🔥", desc: "일간의 기운이 강한 편이에요. 에너지를 쏟을 방향을 잘 고르는 게 중요해요." },
  "신약(身弱)": { icon: "🌊", desc: "일간의 기운이 약한 편이에요. 나를 지지해주는 환경과 사람을 잘 고르면 훨씬 잘 발휘돼요." },
  "중화(中和)": { icon: "⚖️", desc: "일간의 기운이 균형 잡힌 상태예요. 폭넓은 환경에서 두루 안정적인 성과를 낼 수 있는 타입입니다." },
};

interface Props {
  natal: NatalResult;
  postnatal: PostnatalResult;
}

export default function PersonalityTab({ natal, postnatal }: Props) {
  const [showYongshin, setShowYongshin] = useState(false);
  const meInfo = getElementInfo(natal.my_element.name);
  const yongshinInfo = getElementInfo(natal.yongshin_info.name);
  const dayStemYang = YANG_STEMS.has(natal.day_stem);
  const stemProfile = STEM_PROFILE[natal.day_stem] ?? STEM_PROFILE["甲"];
  const strengthDesc = STRENGTH_DESC[natal.strength_label] ?? STRENGTH_DESC["중화(中和)"];
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
    return { year: postnatal.year + offset, ganji: stem + branch, stemEl, branchEl,
      matchesYongshin: stemEl === natal.yongshin_info.name || branchEl === natal.yongshin_info.name };
  };

  let nearestYongshinOffset: number | null = null;
  for (let i = 2; i <= 15; i++) {
    if (makeYear(i).matchesYongshin) { nearestYongshinOffset = i; break; }
  }

  const yearItems = [
    { ...makeYear(0), label: "올해" },
    { ...makeYear(1), label: "내년" },
    ...(nearestYongshinOffset !== null ? [{ ...makeYear(nearestYongshinOffset), label: null }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* 일간 정체성 카드 */}
      <div className="slide-card" style={{ borderColor: meInfo.borderColor }}>
        <div className="slide-card__header">
          <SectionHeader emoji="✨" title="일간(日干) — 나를 나타내는 기운" noMargin />
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          <div className="flex items-start gap-5">
            <div
              className="flex-shrink-0 w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-0.5"
              style={{ backgroundColor: meInfo.bgColor, border: `1.5px solid ${meInfo.borderColor}` }}
            >
              <span className="font-heading text-4xl font-bold leading-none" style={{ color: meInfo.color }}>
                {natal.day_stem}
              </span>
              <span className="text-[11px] font-medium" style={{ color: meInfo.color }}>
                {meInfo.korean}({meInfo.label})
              </span>
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-2xl font-bold text-[var(--color-ink)]">
                  {stemProfile.nickname}
                </span>
                <span className="text-xs text-[var(--color-ink-faint)]">
                  {dayStemYang ? "양(陽)" : "음(陰)"}
                </span>
              </div>
              <p className="text-sm text-[var(--color-ink-muted)] mt-0.5 leading-relaxed">
                {stemProfile.tagline}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {stemProfile.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="text-xs px-2.5 py-0.5 rounded-full border font-medium"
                    style={{ color: meInfo.color, backgroundColor: meInfo.bgColor, borderColor: meInfo.borderColor }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 오행으로 보는 성격 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <SectionHeader emoji="🌿" title="오행 분석" noMargin />
        </div>
        <div className="divider" />
        <div className="slide-card__body space-y-3">
          <p className="text-xs text-[var(--color-ink-faint)] leading-relaxed">
            오행(五行)은 세상 모든 것을 나무(木)·불(火)·흙(土)·쇠(金)·물(水) 다섯 가지 기운으로 나눈 동양 철학의 정수.
          </p>

          {/* 사주팔자 미니 그리드 */}
          <div className="grid grid-cols-4 gap-1.5">
            {natal.pillars.map((pillar, i) => {
              const stemChar = pillar[0] ?? "";
              const branchChar = pillar[1] ?? "";
              const stemInfo = getElementInfo(STEM_ELEMENT[stemChar] ?? "");
              const branchInfo = getElementInfo(BRANCH_ELEMENT[branchChar] ?? "");
              const isMe = i === 2;
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className={`text-[9px] font-medium ${isMe ? "text-[var(--color-gold)]" : "text-[var(--color-ink-faint)]"}`}>
                    {PILLAR_LABELS_KO[i]} {PILLAR_LABELS_SHORT[i]}柱
                  </span>
                  <div
                    className="w-full h-10 rounded-lg flex flex-col items-center justify-center gap-0 border"
                    style={{ backgroundColor: stemInfo.bgColor, borderColor: stemInfo.borderColor }}
                  >
                    <span className="font-heading text-base font-bold leading-none" style={{ color: stemInfo.color }}>{stemChar}</span>
                    <span className="text-[9px] font-medium leading-none mt-0.5" style={{ color: stemInfo.color }}>{STEM_ELEMENT[stemChar]}</span>
                  </div>
                  <div
                    className="w-full h-10 rounded-lg flex flex-col items-center justify-center gap-0 border"
                    style={{ backgroundColor: branchInfo.bgColor, borderColor: branchInfo.borderColor }}
                  >
                    <span className="font-heading text-base font-bold leading-none" style={{ color: branchInfo.color }}>{branchChar}</span>
                    <span className="text-[9px] font-medium leading-none mt-0.5" style={{ color: branchInfo.color }}>{BRANCH_ELEMENT[branchChar]}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="divider" />

          {/* 세로 바 차트 — 많은 순 정렬 */}
          {(() => {
            const sorted = [...ELEMENT_ORDER].sort(
              (a, b) => (natal.element_stats[b] ?? 0) - (natal.element_stats[a] ?? 0)
            );
            const maxCount = Math.max(...sorted.map((el) => natal.element_stats[el] ?? 0), 1);
            const BAR_H = 72;
            return (
              <div className="flex gap-2">
                {sorted.map((el) => {
                  const count = natal.element_stats[el] ?? 0;
                  const barH = (count / maxCount) * BAR_H;
                  const elInfo = getElementInfo(el);
                  const isZero = count === 0;
                  return (
                    <div
                      key={el}
                      className="flex-1 flex flex-col items-center gap-0.5"
                      style={{ opacity: isZero ? 0.2 : 1 }}
                    >
                      <span className="text-xs font-bold" style={{ color: elInfo.color }}>
                        {count}
                      </span>
                      <div className="w-full flex flex-col justify-end" style={{ height: BAR_H }}>
                        <div
                          className="w-full rounded-t-md transition-all duration-700"
                          style={{ height: count > 0 ? barH : 0, backgroundColor: elInfo.color }}
                        />
                      </div>
                      <span className="font-heading text-sm font-bold" style={{ color: elInfo.color }}>{el}</span>
                      <span className="text-[9px] text-[var(--color-ink-faint)]">{elInfo.korean}</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* 과다 콜아웃 — KkachiTip */}
          {ELEMENT_ORDER.filter((el) => (natal.element_stats[el] ?? 0) >= 3).map((el) => (
            <KkachiTip key={el}>
              {getElementInfo(el).korean}({el}) — {OHENG_PERSONALITY[el].excess}
            </KkachiTip>
          ))}

        </div>
      </div>

      {/* 신강/신약 & 용신 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <SectionHeader emoji="⚡" title="신강·신약(身強·身弱)" noMargin />
        </div>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          {/* 개념 설명 */}
          <p className="text-xs text-[var(--color-ink-faint)] leading-relaxed">
            나의 일간(日干)인 <span className="font-bold" style={{ color: meInfo.color }}>{STEM_READING[natal.day_stem] ?? natal.day_stem}({natal.day_stem})</span>가
            사주 전체에 얼마나 영향을 미치는지 보여주는 척도.
          </p>

          {/* 게이지 */}
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
                {natal.strength_value > 0 ? `+${natal.strength_value}` : natal.strength_value}
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
          <KkachiTip>{strengthDesc.desc}</KkachiTip>

          <div className="divider" />
          <SectionHeader emoji="🌟" title="용신(用神)" noMargin />
          <p className="text-xs text-[var(--color-ink-faint)] leading-relaxed">
            사주의 균형을 잡아주어 나에게 이로운 오행을 뜻함. 용신의 기운이 강한 해가 행운이 따름.
          </p>

          {!showYongshin ? (
            <button
              onClick={() => setShowYongshin(true)}
              className="btn-shimmer w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:opacity-70"
            >
              ✨ 나의 용신 확인하기
            </button>
          ) : (
            <>
              {/* 용신 카드 */}
              <div
                className="animate-glow-pulse rounded-2xl p-5 flex flex-col items-center gap-2"
                style={{ backgroundColor: yongshinInfo.bgColor, border: `2px solid ${yongshinInfo.borderColor}`, "--glow-color": yongshinInfo.borderColor } as React.CSSProperties}
              >
                <span className="font-heading text-6xl font-bold leading-none" style={{ color: yongshinInfo.color }}>
                  {natal.yongshin_info.name}
                </span>
                <span className="text-sm font-semibold" style={{ color: yongshinInfo.color }}>
                  {yongshinInfo.korean}
                </span>
                <p className="text-sm text-center leading-relaxed mt-1" style={{ color: yongshinInfo.color }}>
                  {natal.yongshin_info.meaning}
                </p>
              </div>

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
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ color: stemElInfo.color, backgroundColor: stemElInfo.bgColor }}
                        >
                          {stemElInfo.korean}
                        </span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ color: branchElInfo.color, backgroundColor: branchElInfo.bgColor }}
                        >
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

    </div>
  );
}
