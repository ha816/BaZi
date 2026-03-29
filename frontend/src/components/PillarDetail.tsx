"use client";

import type { SipsinInfo, SibiUnseongInfo, SinsalInfo } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";
import TermBadge from "./TermBadge";
import DetailToggle from "./DetailToggle";

interface Props {
  pillars: string[];
  sipsin: SipsinInfo[];
  sibiUnseong: SibiUnseongInfo[];
  sinsal: SinsalInfo[];
  dayStem: string;
}

const PILLAR_LABELS = ["태어난 해", "태어난 달", "태어난 날", "태어난 시간"];
const PILLAR_SUB = ["조상·사회", "부모·성장", "나·배우자", "자녀·노년"];
const PILLAR_TERMS = ["년주", "월주", "일주", "시주"];

const STEM_ELEMENT: Record<string, string> = {
  // 한글
  갑: "木", 을: "木", 병: "火", 정: "火", 무: "土",
  기: "土", 경: "金", 신: "金", 임: "水", 계: "水",
  // 한자
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土",
  己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
};

const BRANCH_ELEMENT: Record<string, string> = {
  // 한글
  자: "水", 축: "土", 인: "木", 묘: "木", 진: "土", 사: "火",
  오: "火", 미: "土", 신: "金", 유: "金", 술: "土", 해: "水",
  // 한자
  子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火",
  午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水",
};

function getCharElement(char: string, isStem: boolean): string {
  return (isStem ? STEM_ELEMENT : BRANCH_ELEMENT)[char] ?? "";
}

/** 사주 네 기둥의 오행 구성을 한 줄로 요약 */
function buildPillarSummary(pillars: string[]): string {
  const elements: string[] = [];
  pillars.forEach((p) => {
    const stemEl = getCharElement(p[0], true);
    const branchEl = getCharElement(p[1], false);
    if (stemEl) elements.push(stemEl);
    if (branchEl) elements.push(branchEl);
  });

  const counts: Record<string, number> = {};
  elements.forEach((el) => { counts[el] = (counts[el] ?? 0) + 1; });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return "사주 구성을 분석 중입니다.";
  const strongest = sorted[0];
  const strongestInfo = getElementInfo(strongest[0]);

  const missing = ["木", "火", "土", "金", "水"].filter((e) => !counts[e]);

  let summary = `여덟 글자 중 ${strongestInfo.korean}(${strongest[0]})의 기운이 ${strongest[1]}개로 가장 많아요.`;

  if (missing.length > 0) {
    const missingNames = missing.map((e) => getElementInfo(e).korean).join("·");
    summary += ` ${missingNames}의 기운은 없어서, 이 부분을 보완해주는 운이 오면 좋아요.`;
  } else {
    summary += " 다섯 가지 기운이 모두 있어 균형 잡힌 구성이에요.";
  }

  return summary;
}

/* ── 십신 그룹 요약 ── */
const SIPSIN_GROUP: Record<string, string> = {
  "比肩": "비겁", "劫財": "비겁",
  "食神": "식상", "傷官": "식상",
  "偏財": "재성", "正財": "재성",
  "偏官": "관성", "正官": "관성",
  "偏印": "인성", "正印": "인성",
};

const GROUP_DESC: Record<string, { strong: string; label: string }> = {
  비겁: { strong: "자기 주장이 뚜렷하고 독립적으로 일하길 좋아해요. 경쟁에서 힘을 발휘하지만 고집이 세다는 소리를 듣기도 해요", label: "독립심·경쟁력" },
  식상: { strong: "창의적이고 표현력이 뛰어나요. 재능이 넘치지만 한 가지에 오래 집중하긴 어려울 수 있어요", label: "표현력·창의력" },
  재성: { strong: "현실 감각이 좋고 돈을 다루는 능력이 있어요. 실용적이지만 바쁘게 살며 스트레스받기도 해요", label: "재물·현실감각" },
  관성: { strong: "조직에서 인정받기 좋은 타입이에요. 책임감이 강하지만 규칙에 눌리기도 해요", label: "직장·사회적안정" },
  인성: { strong: "학문적 재능이 있고 생각이 깊어요. 공부·자격증 쪽에 유리하지만 행동보다 생각이 앞설 수 있어요", label: "학문·사고력" },
};

function buildSipsinNarrative(sipsin: SipsinInfo[]): string {
  const counts: Record<string, number> = {};
  sipsin.forEach((s) => {
    const g = SIPSIN_GROUP[s.sipsin_name];
    if (g) counts[g] = (counts[g] ?? 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return "";

  const top = sorted[0];
  const topDesc = GROUP_DESC[top[0]];
  let text = topDesc.strong + ".";

  if (sorted.length >= 2) {
    const second = sorted[1];
    const secondDesc = GROUP_DESC[second[0]];
    text += ` ${secondDesc.label} 쪽 기운도 함께 가지고 있어요.`;
  }

  const allGroups = ["비겁", "식상", "재성", "관성", "인성"];
  const missing = allGroups.filter((g) => !counts[g]);
  if (missing.length > 0 && missing.length <= 2) {
    const missingLabels = missing.map((g) => GROUP_DESC[g].label).join(", ");
    text += ` 반면 ${missingLabels} 부분은 약한 편이니 의식적으로 보완하면 좋아요.`;
  }

  return text;
}

/* ── 십이운성 요약 ── */
const STRONG_UNSEONG = new Set(["建祿", "帝旺", "冠帶", "長生"]);
const WEAK_UNSEONG = new Set(["病", "死", "絕"]);

function buildUnseongNarrative(sibiUnseong: SibiUnseongInfo[]): string {
  const strongCount = sibiUnseong.filter((u) => STRONG_UNSEONG.has(u.unseong_name)).length;
  const weakCount = sibiUnseong.filter((u) => WEAK_UNSEONG.has(u.unseong_name)).length;

  if (strongCount >= 3) return "전반적으로 에너지가 충만한 사주예요. 타고난 실력을 마음껏 발휘할 수 있는 상태입니다.";
  if (strongCount >= 2) return "대체로 안정적인 에너지 흐름이에요. 꾸준히 성장하면서 성과를 낼 수 있는 타입입니다.";
  if (weakCount >= 2) return "에너지가 다소 약한 편이에요. 무리하기보다 전략적으로 움직이며 에너지를 아끼는 게 좋아요.";
  return "에너지 흐름에 굴곡이 있는 편이에요. 시기에 따라 컨디션 차이가 클 수 있으니 몸 관리에 신경 쓰면 좋겠어요.";
}

/* ── 신살 요약 ── */
function buildSinsalNarrative(sinsal: SinsalInfo[]): string {
  if (sinsal.length === 0) return "";
  if (sinsal.length === 1) {
    return `사주에 ${sinsal[0].sinsal_korean}이 있어요. ${sinsal[0].meaning} 쪽에 타고난 기운이 있다는 뜻이에요.`;
  }
  const names = sinsal.map((s) => s.sinsal_korean).join(", ");
  const allKeywords = sinsal.flatMap((s) => s.meaning.split("·"));
  const unique = [...new Set(allKeywords)].slice(0, 5);
  return `사주에 ${names}이 있어요. ${unique.join(", ")} 쪽에 특별한 재능이나 인연이 있다는 뜻이에요.`;
}

export default function PillarDetail({
  pillars,
  sipsin,
  sibiUnseong,
  sinsal,
}: Props) {
  const summary = buildPillarSummary(pillars);

  return (
    <div>
      {/* Summary explanation */}
      <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed mb-5 px-1">
        아래는 태어난 시간을 바탕으로 뽑은 여덟 글자예요.
        각 글자는 하늘과 땅의 기운을 담고 있고, 이 조합이 나의 성격과 운세의 바탕이 됩니다.
        <br />
        <span className="text-[var(--color-ink)] font-medium">{summary}</span>
      </p>

      {/* Pillar grid */}
      <div className="grid grid-cols-4 gap-3 md:gap-4 mb-8">
        {pillars.map((pillar, i) => {
          const stem = pillar[0];
          const branch = pillar[1];
          const stemEl = getCharElement(stem, true);
          const branchEl = getCharElement(branch, false);
          const stemInfo = stemEl ? getElementInfo(stemEl) : null;
          const branchInfo = branchEl ? getElementInfo(branchEl) : null;
          const isMe = i === 2;

          return (
            <div
              key={i}
              className={`rounded-xl text-center border transition-shadow ${
                isMe
                  ? "border-[var(--color-gold)] bg-[var(--color-gold-faint)] shadow-md"
                  : "border-[var(--color-border-light)] bg-[var(--color-card)]"
              }`}
            >
              {/* Label */}
              <div className="px-3 py-3 border-b border-[var(--color-border-light)]">
                <div className="text-sm font-medium text-[var(--color-ink)]">
                  {PILLAR_LABELS[i]}
                </div>
                <div className="text-xs text-[var(--color-ink-faint)]">
                  {PILLAR_SUB[i]} <span className="opacity-60">(<TermBadge term={PILLAR_TERMS[i]} />)</span>
                </div>
              </div>

              {/* Stem */}
              <div className="px-3 py-4">
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-ink-faint)] mb-1">
                  하늘
                </div>
                <div
                  className="font-heading text-3xl md:text-4xl font-bold"
                  style={{ color: stemInfo?.color ?? "var(--color-ink)" }}
                >
                  {stem}
                </div>
                {stemInfo && (
                  <div className="text-xs mt-1" style={{ color: stemInfo.color }}>
                    {stemInfo.korean}
                  </div>
                )}
                {isMe && (
                  <div className="text-[11px] text-[var(--color-gold)] font-medium mt-1.5">
                    나를 나타내는 글자
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="mx-4 h-px bg-[var(--color-border-light)]" />

              {/* Branch */}
              <div className="px-3 py-4">
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-ink-faint)] mb-1">
                  땅
                </div>
                <div
                  className="font-heading text-3xl md:text-4xl font-bold"
                  style={{ color: branchInfo?.color ?? "var(--color-ink)" }}
                >
                  {branch}
                </div>
                {branchInfo && (
                  <div className="text-xs mt-1" style={{ color: branchInfo.color }}>
                    {branchInfo.korean}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sipsin */}
      {sipsin.length > 0 && (
        <div className="mb-6">
          <h4 className="font-heading text-base font-semibold text-[var(--color-ink)] mb-3">
            글자들의 관계와 역할
            <span className="text-sm font-normal text-[var(--color-ink-faint)] ml-2">(<TermBadge term="십신" />)</span>
          </h4>
          <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">
            {buildSipsinNarrative(sipsin)}
          </p>
          <DetailToggle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {sipsin.map((s, i) => (
                <div
                  key={i}
                  className="rounded-lg p-3 bg-[var(--color-ivory)] border border-[var(--color-border-light)] text-center"
                >
                  <div className="font-heading text-lg font-bold text-[var(--color-ink)]">{s.char}</div>
                  <div className="text-sm font-medium text-[var(--color-gold)]">{s.sipsin_name}</div>
                  <div className="text-xs text-[var(--color-ink-faint)] mt-1">{s.domain}</div>
                </div>
              ))}
            </div>
          </DetailToggle>
        </div>
      )}

      {/* Sibi unseong */}
      {sibiUnseong.length > 0 && (
        <div className="mb-6">
          <h4 className="font-heading text-base font-semibold text-[var(--color-ink)] mb-3">
            에너지 단계
            <span className="text-sm font-normal text-[var(--color-ink-faint)] ml-2">(<TermBadge term="십이운성" />)</span>
          </h4>
          <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">
            {buildUnseongNarrative(sibiUnseong)}
          </p>
          <DetailToggle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {sibiUnseong.map((u, i) => (
                <div
                  key={i}
                  className="rounded-lg p-3 bg-[var(--color-ivory)] border border-[var(--color-border-light)] text-center"
                >
                  <div className="text-xs text-[var(--color-ink-faint)]">{u.pillar}</div>
                  <div className="font-heading text-lg font-bold text-[var(--color-ink)]">{u.unseong_name}</div>
                  <div className="text-xs text-[var(--color-ink-faint)] mt-1">{u.meaning}</div>
                </div>
              ))}
            </div>
          </DetailToggle>
        </div>
      )}

      {/* Sinsal */}
      {sinsal.length > 0 && (
        <div>
          <h4 className="font-heading text-base font-semibold text-[var(--color-ink)] mb-3">
            특별한 기운
            <span className="text-sm font-normal text-[var(--color-ink-faint)] ml-2">(<TermBadge term="신살" />)</span>
          </h4>
          <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">
            {buildSinsalNarrative(sinsal)}
          </p>
          <DetailToggle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sinsal.map((s, i) => (
                <div
                  key={i}
                  className="rounded-lg p-3 bg-[var(--color-ivory)] border border-[var(--color-border-light)] flex items-center gap-4"
                >
                  <span className="font-heading text-lg font-bold text-[var(--color-ink)]">{s.branch}</span>
                  <div>
                    <div className="text-sm font-medium text-[var(--color-gold)]">{s.sinsal_korean}</div>
                    <div className="text-xs text-[var(--color-ink-faint)]">{s.meaning}</div>
                  </div>
                </div>
              ))}
            </div>
          </DetailToggle>
        </div>
      )}
    </div>
  );
}
