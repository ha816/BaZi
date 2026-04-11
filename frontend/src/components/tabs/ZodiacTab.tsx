"use client";
import React, { useState } from "react";
import type { NatalResult, PostnatalResult } from "@/types/analysis";
import KkachiTip from "@/components/KkachiTip";
import PillarDetail from "@/components/PillarDetail";

const ZODIAC_INFO: Record<string, {
  kor: string;
  emoji: string;
  keyword: string;
  traits: string[];
  strength: string;
  weakness: string;
  compatible: string;
}> = {
  "子": {
    kor: "쥐",    emoji: "🐭", keyword: "지혜·적응",
    traits: ["빠른 두뇌 회전", "뛰어난 임기응변", "사교적 인맥 관리"],
    strength: "어떤 환경에서도 빠르게 적응하고 기회를 포착하는 능력이 탁월합니다.",
    weakness: "너무 계산적으로 보일 수 있고, 지나치게 눈치를 보다 결단이 늦어질 수 있어요.",
    compatible: "辰·申",
  },
  "丑": {
    kor: "소",    emoji: "🐂", keyword: "성실·인내",
    traits: ["끈질긴 인내력", "성실한 실행력", "안정적인 신뢰감"],
    strength: "묵묵히 맡은 일을 해내는 뚝심과 신뢰를 쌓는 능력이 강점입니다.",
    weakness: "변화에 느리게 반응하고 고집이 세져 유연성이 부족해 보일 수 있어요.",
    compatible: "酉·巳",
  },
  "寅": {
    kor: "호랑이", emoji: "🐯", keyword: "용기·추진",
    traits: ["대담한 도전 정신", "강한 리더십", "열정적인 추진력"],
    strength: "어려운 상황에서도 앞장서고 사람들을 이끄는 카리스마가 있습니다.",
    weakness: "충동적으로 행동하거나 타인의 의견을 무시하는 독불장군 기질이 나올 수 있어요.",
    compatible: "午·戌",
  },
  "卯": {
    kor: "토끼",  emoji: "🐰", keyword: "온화·예술",
    traits: ["섬세한 감수성", "뛰어난 예술 감각", "부드러운 소통 능력"],
    strength: "사람을 편안하게 만드는 분위기와 창의적인 감각이 강점입니다.",
    weakness: "상처를 쉽게 받고 갈등을 회피하다 보니 중요한 결정을 미루는 경향이 있어요.",
    compatible: "未·亥",
  },
  "辰": {
    kor: "용",    emoji: "🐲", keyword: "카리스마·야망",
    traits: ["뛰어난 카리스마", "큰 그림을 보는 시야", "강한 자기 확신"],
    strength: "비전을 제시하고 사람들을 움직이는 특유의 매력과 추진력이 있습니다.",
    weakness: "권위적으로 굴거나 자기 주장이 너무 강해 팀워크를 해칠 수 있어요.",
    compatible: "子·申",
  },
  "巳": {
    kor: "뱀",    emoji: "🐍", keyword: "직관·지략",
    traits: ["날카로운 통찰력", "치밀한 전략 수립", "깊은 집중력"],
    strength: "겉으론 조용하지만 상황을 꿰뚫어 보고 정확한 판단을 내리는 능력이 탁월합니다.",
    weakness: "의심이 많아지면 인간관계에 벽을 치고 혼자 끌어안는 경향이 생겨요.",
    compatible: "酉·丑",
  },
  "午": {
    kor: "말",    emoji: "🐴", keyword: "열정·자유",
    traits: ["넘치는 열정 에너지", "자유로운 영혼", "빠른 행동력"],
    strength: "한번 불타오르면 누구도 못 따라오는 폭발적인 열정과 실행력이 있습니다.",
    weakness: "지속력이 약하고 구속받는 것을 극도로 싫어해 조직 생활에서 마찰이 생길 수 있어요.",
    compatible: "寅·戌",
  },
  "未": {
    kor: "양",    emoji: "🐑", keyword: "배려·감수성",
    traits: ["따뜻한 공감 능력", "섬세한 감수성", "예술·창작 기질"],
    strength: "상대의 감정을 잘 읽고 배려하는 능력, 창의적인 아이디어 발상이 강점입니다.",
    weakness: "우유부단하고 남의 눈치를 너무 봐서 자신의 의견을 제대로 표현 못할 수 있어요.",
    compatible: "卯·亥",
  },
  "申": {
    kor: "원숭이", emoji: "🐒", keyword: "재치·변통",
    traits: ["뛰어난 재치와 유머", "빠른 상황 판단", "다재다능한 적응력"],
    strength: "어떤 상황도 유연하게 전환하고 사람들을 즐겁게 만드는 능력이 있습니다.",
    weakness: "변덕스러워 보이거나 깊이 없이 넓기만 하다는 인상을 줄 수 있어요.",
    compatible: "子·辰",
  },
  "酉": {
    kor: "닭",    emoji: "🐓", keyword: "완벽·분석",
    traits: ["날카로운 분석력", "꼼꼼한 완벽주의", "높은 심미안"],
    strength: "세밀한 부분까지 놓치지 않고 완성도 높은 결과물을 만드는 능력이 탁월합니다.",
    weakness: "기준이 너무 높아 타인과 본인 모두를 지치게 만드는 완벽주의가 부담될 수 있어요.",
    compatible: "丑·巳",
  },
  "戌": {
    kor: "개",    emoji: "🐕", keyword: "충성·정의",
    traits: ["강한 충성심과 의리", "정의감과 원칙", "믿음직한 신뢰"],
    strength: "한번 믿은 사람에게는 끝까지 신의를 지키고 옳다고 믿는 일에 용감하게 나섭니다.",
    weakness: "고지식하고 완고한 면이 있어서 상황에 따라 유연하게 타협하지 못할 수 있어요.",
    compatible: "寅·午",
  },
  "亥": {
    kor: "돼지",  emoji: "🐗", keyword: "너그러움·복",
    traits: ["넓은 포용력", "타고난 복(福)의 기운", "순수한 열정"],
    strength: "사람을 포용하는 너그러운 성품과 무언가에 빠지면 깊이 몰입하는 순수한 열정이 있습니다.",
    weakness: "너무 순진해서 사기를 당하거나 주변에 이용당하는 일이 생길 수 있어요.",
    compatible: "卯·未",
  },
};

const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const PILLAR_ROLES = [
  { label: "년주(年柱)", role: "사회적 자아", desc: "남들이 보는 나의 대외 이미지, 사회적 첫인상" },
  { label: "월주(月柱)", role: "직장·부모 관계", desc: "일과 직장, 부모 및 윗사람과의 에너지 흐름" },
  { label: "일주(日柱)", role: "본래 자아", desc: "진짜 나의 내면, 배우자와의 인연 에너지" },
  { label: "시주(時柱)", role: "자녀·미래", desc: "자녀 인연과 노후·미래를 향한 에너지" },
];

const SAMHAP_GROUPS: [string[], string, string][] = [
  [["申", "子", "辰"], "水", "水 삼합"],
  [["巳", "酉", "丑"], "金", "金 삼합"],
  [["寅", "午", "戌"], "火", "火 삼합"],
  [["亥", "卯", "未"], "木", "木 삼합"],
];

const YUGHAP_PAIRS: [string, string][] = [
  ["子", "丑"], ["寅", "亥"], ["卯", "戌"], ["辰", "酉"], ["巳", "申"], ["午", "未"],
];

const WONJIN_PAIRS: [string, string][] = [
  ["子", "未"], ["丑", "午"], ["寅", "酉"], ["卯", "申"], ["辰", "亥"], ["巳", "戌"],
];

const CLASH_PAIRS: [string, string][] = [
  ["子", "午"], ["丑", "未"], ["寅", "申"], ["卯", "酉"], ["辰", "戌"], ["巳", "亥"],
];

type RelationType = "삼합" | "육합" | "원진" | "충" | "보통" | "나";

function getRelation(a: string, b: string): RelationType {
  if (a === b) return "나";
  if (SAMHAP_GROUPS.some(([g]) => g.includes(a) && g.includes(b))) return "삼합";
  if (YUGHAP_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return "육합";
  if (CLASH_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return "충";
  if (WONJIN_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return "원진";
  return "보통";
}

const RELATION_STYLE: Record<RelationType, { label: string; color: string; bg: string; border: string }> = {
  "나":   { label: "나",        color: "#8A5A10", bg: "#F5DC90", border: "#C89030" },
  "삼합": { label: "삼합(三合)", color: "#1A7A4A", bg: "#C8EDD8", border: "#5CB882" },
  "육합": { label: "육합(六合)", color: "#1A5FA0", bg: "#C8DFF5", border: "#5A9ED0" },
  "보통": { label: "보통",        color: "#8A8A96", bg: "#F0F0F4", border: "#C8C8D4" },
  "원진": { label: "원진(怨嗔)", color: "#B05A20", bg: "#FCDDC0", border: "#E09050" },
  "충":   { label: "충(衝)",     color: "#B82020", bg: "#FBCFC8", border: "#E07070" },
};


interface Props {
  natal: NatalResult;
  postnatal: PostnatalResult;
  name?: string;
}

export default function ZodiacTab({ natal, postnatal, name }: Props) {
  const [showYearGungham, setShowYearGungham] = useState(false);
  const yearBranch = natal.pillars[0]?.[1] ?? "";
  const zodiac = ZODIAC_INFO[yearBranch];

  if (!zodiac) return null;

  const namePrefix = name ? `${name}님` : "이 사주";

  // 4기둥 지지 추출
  const pillarBranches = natal.pillars.map((p) => p[1] ?? "");

  // 12띠 관계 계산
  const relations = BRANCHES.map((b) => ({
    branch: b,
    info: ZODIAC_INFO[b],
    relation: getRelation(yearBranch, b),
  }));

  // 삼합 여부 및 그룹
  const mySamhap = SAMHAP_GROUPS.find(([g]) => g.includes(yearBranch));
  const samhapPartners = mySamhap ? mySamhap[0].filter((b) => b !== yearBranch) : [];
  const hasSamhapInPillars = pillarBranches.some((b) => samhapPartners.includes(b));


  // 연도별 띠 궁합 — 백엔드 데이터 사용
  const YEAR_LABELS = ["올해", "내년", "가까운 좋은 해"];
  const yearGunghamRows = postnatal.year_zodiac_relations.map((r, idx) => ({
    ...r,
    info: ZODIAC_INFO[r.branch],
    labelPrefix: YEAR_LABELS[idx] ?? "",
  }));

  // 4기둥 지지 조합 까치 설명
  const pillarTip = (() => {
    const counts: Record<string, number> = {};
    pillarBranches.forEach((b) => { counts[b] = (counts[b] ?? 0) + 1; });

    const notes: string[] = [];
    Object.entries(counts).forEach(([b, cnt]) => {
      if (cnt >= 2) notes.push(`${ZODIAC_INFO[b]?.kor}띠가 ${cnt}번 겹쳐 있고`);
    });

    const seenPairs = new Set<string>();
    for (let a = 0; a < pillarBranches.length; a++) {
      for (let b = a + 1; b < pillarBranches.length; b++) {
        if (pillarBranches[a] === pillarBranches[b]) continue;
        const key = [pillarBranches[a], pillarBranches[b]].sort().join("-");
        if (seenPairs.has(key)) continue;
        seenPairs.add(key);
        const r = getRelation(pillarBranches[a], pillarBranches[b]);
        const na = ZODIAC_INFO[pillarBranches[a]]?.kor ?? pillarBranches[a];
        const nb = ZODIAC_INFO[pillarBranches[b]]?.kor ?? pillarBranches[b];
        if (r === "삼합") notes.push(`${na}띠·${nb}띠가 삼합으로 에너지가 강하게 모이고`);
        else if (r === "육합") notes.push(`${na}띠·${nb}띠가 육합으로 잘 어우러지고`);
        else if (r === "충") notes.push(`${na}띠·${nb}띠가 충으로 긴장감이 있고`);
      }
    }

    if (notes.length === 0) {
      return `${namePrefix}의 사주지지는 특별한 충·합 없이 각자의 영역에서 고르게 에너지를 발휘하는 안정적인 구성입니다.`;
    }
    return `${namePrefix}의 사주지지는 ${notes.join(" ")} 있어 사주 안에서 독특한 에너지 흐름이 만들어집니다.`;
  })();

  const nearestGoodYear = yearGunghamRows.length > 2 ? yearGunghamRows[2] : null;

  return (
    <div className="space-y-4">

      {/* 나의 띠 심층 프로필 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">
            십이지신(十二支神)
          </h3>
          <p className="text-xs text-[var(--color-ink-faint)] mt-1">
            쥐·소·호랑이·토끼·용·뱀·말·양·원숭이·닭·개·돼지 — 12가지 동물 신령으로 해를 나누고, 태어난 해의 지지(地支)가 곧 자신의 띠입니다.
          </p>
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-[var(--color-ivory-warm)] flex items-center justify-center text-3xl">
              {zodiac.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-heading text-lg font-bold text-[var(--color-ink)]">{zodiac.kor}띠</span>
                <span className="text-xs text-[var(--color-ink-faint)]">{yearBranch} · {zodiac.keyword}</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {zodiac.traits.map((t) => (
                  <span key={t} className="text-xs bg-[var(--color-ivory)] border border-[var(--color-border-light)] rounded-full px-2.5 py-0.5 text-[var(--color-ink-muted)]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <img
            src={`/kkachi/zodiac_${zodiac.kor}.png`}
            alt={`${zodiac.kor}띠`}
            className="w-2/3 mx-auto block mt-3 rounded-3xl"
            style={{
              mixBlendMode: "multiply",
              maskImage: "radial-gradient(ellipse 85% 80% at 50% 45%, black 55%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 85% 80% at 50% 45%, black 55%, transparent 100%)",
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      </div>

      {/* 12띠 궁합 등급 표 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">
            십이지 충합(十二支 衝合)
          </h3>
          <p className="text-xs text-[var(--color-ink-faint)] mt-1 leading-relaxed">
            년주인 {zodiac.kor}띠({yearBranch}) 기준 충·합 분류입니다.
            실제 궁합은 일주(日柱) 포함 전체 사주로 판단하므로 참고 지표로만 활용하세요!
          </p>
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          <div className="grid grid-cols-4 gap-2 mb-4">
            {relations.map(({ branch, info, relation }) => {
              const style = RELATION_STYLE[relation];
              if (!info) return null;
              return (
                <div
                  key={branch}
                  className="rounded-xl p-2.5 border text-center"
                  style={{ backgroundColor: style.bg, borderColor: style.border }}
                >
                  <div className="text-xl mb-0.5">{info.emoji}</div>
                  <div className="font-heading text-sm font-bold text-[var(--color-ink)]">
                    {info.kor}
                    <span className="text-[10px] font-normal text-[var(--color-ink-faint)] ml-0.5">({branch})</span>
                  </div>
                  <span
                    className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1"
                    style={{ color: style.color, backgroundColor: style.bg, border: `1px solid ${style.border}` }}
                  >
                    {style.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 범례 */}
          <div className="rounded-lg p-3 bg-[var(--color-ivory)] border border-[var(--color-border-light)]">
            <p className="text-[10px] font-semibold text-[var(--color-ink-faint)] mb-2">관계 분류 기준</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {(["삼합", "육합", "보통", "원진", "충"] as RelationType[]).map((r) => {
                const s = RELATION_STYLE[r];
                const desc: Record<string, string> = {
                  "삼합": "최고 궁합 · 에너지 시너지",
                  "육합": "좋은 궁합 · 조화로운 관계",
                  "보통": "무난 · 특별한 충합 없음",
                  "원진": "긴장·갈등 · 노력 필요",
                  "충": "대립 · 강한 마찰 가능",
                };
                return (
                  <div key={r} className="flex items-center gap-1.5">
                    <span
                      className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ color: s.color, backgroundColor: s.bg, border: `1px solid ${s.border}` }}
                    >
                      {s.label}
                    </span>
                    <span className="text-[10px] text-[var(--color-ink-faint)]">{desc[r]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 사주지지(四柱地支) */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">사주지지(四柱地支)</h3>
          <p className="text-xs text-[var(--color-ink-faint)] mt-1 leading-relaxed">
            사주의 네 기둥 각각에는 지지(地支), 즉 띠가 하나씩 있습니다. 이 띠는 삶의 각 영역에 숨어 있는 나의 본모습입니다.
          </p>
        </div>
        <div className="divider" />
        <div className="slide-card__body space-y-3">
          <PillarDetail pillars={natal.pillars} dayStem={natal.day_stem} highlightBranches={true} />
          <div className="grid grid-cols-4 gap-2">
            {pillarBranches.map((branch, i) => {
              const info = ZODIAC_INFO[branch];
              const role = PILLAR_ROLES[i];
              if (!info || !role) return null;
              const isYear = i === 0;
              return (
                <div
                  key={i}
                  className="rounded-lg p-2.5 border text-center"
                  style={isYear
                    ? { backgroundColor: "#F5F0E7", borderColor: "#D9C49A" }
                    : { backgroundColor: "var(--color-ivory)", borderColor: "var(--color-border-light)" }
                  }
                >
                  <span className="text-xl block mb-1">{info.emoji}</span>
                  <div className="font-heading text-sm font-bold text-[var(--color-ink)] mb-0.5">{branch}</div>
                  <div className="text-[10px] text-[var(--color-ink-muted)] mb-1">{info.kor}띠</div>
                  <div className="text-[10px] font-semibold text-[var(--color-ink-faint)]">{role.label}</div>
                  <div className="text-[10px] text-[var(--color-ink-faint)] leading-snug mt-0.5">{role.role}</div>
                  {isYear && (
                    <span className="inline-block text-[10px] font-semibold px-1 py-0.5 rounded-full bg-[var(--color-gold-faint)] text-[var(--color-gold)] border border-[var(--color-gold-light)] mt-1">기준</span>
                  )}
                </div>
              );
            })}
          </div>
          <KkachiTip label="사주지지 각 자리의 의미">
            년주(年柱)는 사회·대외 이미지, 월주(月柱)는 부모·환경, 일주(日柱)는 나 자신, 시주(時柱)는 자녀·말년을 나타냅니다.
          </KkachiTip>
          <KkachiTip>{pillarTip}</KkachiTip>
        </div>
      </div>

      {/* 연도별 띠 궁합 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">연도별 띠 궁합</h3>
        </div>
        <div className="divider" />
        <div className="slide-card__body space-y-3">
          {!showYearGungham ? (
            <button
              onClick={() => setShowYearGungham(true)}
              className="btn-shimmer w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:opacity-70"
            >
              🐾 연도별 띠 궁합 확인하기
            </button>
          ) : (
            <>
              <div className={`grid gap-2 ${nearestGoodYear ? "grid-cols-3" : "grid-cols-2"}`}>
                {yearGunghamRows.map((row) => {
                  const isGood = row.relation === "삼합" || row.relation === "육합";
                  const style = RELATION_STYLE[row.relation as RelationType] ?? RELATION_STYLE["보통"];
                  return (
                    <div
                      key={row.year}
                      className="flex flex-col items-center gap-1.5 rounded-xl p-3 border text-center"
                      style={{
                        borderColor: isGood ? style.border : "var(--color-border-light)",
                        backgroundColor: isGood ? style.bg : "var(--color-surface)",
                      }}
                    >
                      <span className="text-[10px] font-semibold text-[var(--color-ink-faint)]">{row.labelPrefix}</span>
                      <span className="text-[10px] text-[var(--color-ink-faint)]">{row.year}년</span>
                      <span className="text-2xl">{row.info?.emoji}</span>
                      <span className="text-xs font-semibold text-[var(--color-ink)]">{row.info?.kor}띠</span>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ color: style.color, backgroundColor: style.bg, border: `1px solid ${style.border}` }}
                      >
                        {style.label}
                      </span>
                      <p className="text-[10px] text-[var(--color-ink-faint)] leading-snug mt-0.5">{row.desc}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 삼합 KkachiTip */}
      {hasSamhapInPillars && mySamhap && (
        <KkachiTip>
          {namePrefix}의 사주 4기둥 안에 {mySamhap[2]} 삼합 중 한 글자가 들어 있어요! 삼합은 에너지가 한 방향으로 강하게 모이는 조합입니다. {mySamhap[1]}의 기운이 사주 내부에서 응집되어 {mySamhap[1] === "水" ? "지혜·유연함" : mySamhap[1] === "木" ? "성장·추진력" : mySamhap[1] === "火" ? "열정·표현력" : "결실·안정감"}이 타고난 강점으로 작동합니다.
        </KkachiTip>
      )}
    </div>
  );
}