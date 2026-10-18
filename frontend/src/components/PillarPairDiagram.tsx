"use client";

import type { PillarRelation, PillarSnapshot } from "@/types/analysis";
import { BRANCH_ELEMENT, BRANCH_KOR, STEM_ELEMENT, STEM_KOR } from "@/lib/ganji";
import { getElementInfo } from "@/lib/elementColors";
import KkachiTip from "./KkachiTip";


const KIND_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  // 길(吉) — 녹색 계열
  stem_combine:   { label: "천간합", color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  branch_combine: { label: "육합",   color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  samhap:         { label: "반합",   color: "#0d9488", bg: "#ccfbf1", border: "#5eead4" },
  // 흉(凶) — 따뜻한 톤(빨강→주황→호박→갈색)으로 통일
  branch_clash:   { label: "충",     color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
  stem_clash:     { label: "천간충", color: "#b91c1c", bg: "#fecaca", border: "#f87171" },
  wonjin:         { label: "원진",   color: "#ea580c", bg: "#ffedd5", border: "#fdba74" },
  hyung:          { label: "형",     color: "#db2777", bg: "#fce7f3", border: "#f9a8d4" },
  hae:            { label: "해",     color: "#b45309", bg: "#fef3c7", border: "#fcd34d" },
  pa:             { label: "파",     color: "#92400e", bg: "#fef3c7", border: "#d6a062" },
};

// 백엔드 pillars 는 [年, 月, 日, 時] 순. 표시는 시→일→월→년 (사주 좌→우 통례)
const COLUMN_HEADERS: { kor: string; han: string; origIndex: number }[] = [
  { kor: "시주", han: "時柱", origIndex: 3 },
  { kor: "일주", han: "日柱", origIndex: 2 },
  { kor: "월주", han: "月柱", origIndex: 1 },
  { kor: "년주", han: "年柱", origIndex: 0 },
];

// 기둥별 lead-in 문구 — 한 화면 안에서 자연스러운 변주
const PILLAR_LEAD_IN: Record<string, string> = {
  "시주": "시주(자녀·노년) 측면에서는",
  "일주": "일주(본인·배우자)를 보면",
  "월주": "월주(부모·성장환경) 쪽에서는",
  "년주": "년주(가문·사회 배경) 쪽에는",
};

// 각 관계 종류마다 여러 변주 — label 해시로 결정적 선택
const KIND_DESC_VARIANTS: Record<string, string[]> = {
  stem_combine: [
    "기질이 잘 맞고 마음의 결이 통해요",
    "성향이 자연스럽게 어우러져 편안한 사이가 돼요",
    "서로의 색이 비슷해 호흡이 가벼워져요",
  ],
  branch_combine: [
    "감정 교감이 깊고 호흡이 잘 맞아요",
    "정서적으로 통하는 면이 많아 따뜻한 연결이 생겨요",
    "마음이 가까워져서 함께 있으면 편해져요",
  ],
  samhap: [
    "오행이 어우러져 자연스러운 흐름이 생겨요",
    "세 글자가 합쳐져 같은 결로 묶이는 인연이에요",
    "기운이 한 방향으로 흐르며 시너지가 나요",
  ],
  branch_clash: [
    "정면 충돌·변동의 기운이 있어요",
    "직접 부딪치는 자리라 갈등이 생기기 쉬워요",
    "서로의 자리를 흔들어 변화가 잦을 수 있어요",
  ],
  stem_clash: [
    "의견·가치관 충돌이 잦을 수 있어요",
    "겉으로 드러나는 결이 달라 부딪힘이 있어요",
    "표현 방식이 서로 거슬릴 수 있어요",
  ],
  wonjin: [
    "미묘한 신경 거슬림과 앙금이 쌓이기 쉬워요",
    "겉은 멀쩡한데 속으로 불편함이 쌓이는 자리예요",
    "이유 모를 거리감이 생길 수 있어요",
  ],
  hyung: [
    "서로 자극·억압이 강해 마찰이 생겨요",
    "에너지가 거칠게 부딪쳐 긴장이 흘러요",
    "압박감이 오가며 신경전이 생기기 쉬워요",
  ],
  hae: [
    "방해·다툼이 생기기 쉬워요",
    "결정적인 순간 어긋남이 생길 수 있어요",
    "사소한 일에 다툼이 일어나기 쉬워요",
  ],
  pa: [
    "관계가 깨지거나 흔들리기 쉬워요",
    "안정된 흐름이 부서질 수 있어요",
    "쌓아둔 것이 무너지는 자리예요",
  ],
};

function pickDesc(kind: string, label: string): string {
  const variants = KIND_DESC_VARIANTS[kind];
  if (!variants || variants.length === 0) return "";
  const hash = Array.from(label).reduce((a, c) => a + c.charCodeAt(0), 0);
  return variants[hash % variants.length];
}

// 한 기둥에 여러 관계가 함께 있을 때 — polarity 조합으로 합성 묘사 선택
const MULTI_ALL_POSITIVE_VARIANTS = [
  "여러 결이 함께 통하는 풍성한 자리예요",
  "기질과 마음 양쪽이 모두 맞물려 흐름이 부드러워요",
  "다양한 면에서 호흡이 잘 맞아 안정감이 도는 자리예요",
];
const MULTI_ALL_NEGATIVE_VARIANTS = [
  "여러 결에서 마찰이 겹치는 자리예요",
  "긴장과 어긋남이 짙게 쌓일 수 있는 자리예요",
  "부딪힘이 여러 방향으로 따라오는 부담스러운 자리예요",
];
const MULTI_MIXED_VARIANTS = [
  "통하는 면도 있지만 어긋남이 함께 따라오는 양면적인 자리예요",
  "겉으로는 잘 맞지만 결정적인 순간 마찰이 따라와요",
  "끌림과 거리감이 동시에 있는 미묘한 자리예요",
];

function pickPillarSummary(rels: PillarRelation[]): string {
  if (rels.length === 0) return "";
  if (rels.length === 1) return pickDesc(rels[0].kind, rels[0].label);

  const pos = rels.filter((r) => r.polarity > 0).length;
  const neg = rels.filter((r) => r.polarity < 0).length;
  const seed = rels.map((r) => r.label).join("");
  const hash = Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0);

  let variants: string[];
  if (neg === 0) variants = MULTI_ALL_POSITIVE_VARIANTS;
  else if (pos === 0) variants = MULTI_ALL_NEGATIVE_VARIANTS;
  else variants = MULTI_MIXED_VARIANTS;
  return variants[hash % variants.length];
}

interface Props {
  p1: PillarSnapshot;
  p2: PillarSnapshot;
  relations: PillarRelation[];
  /** 등장 연출 — 시→일→월→년 기둥마다 위(첫 분)·아래(둘째 분) 글자가 도장처럼 찍히고, 그 기둥의 합·충 배지가 뒤따라 튀어나온다.
   *  분석 사주팔자(PillarDetail animate)와 같은 ink-stamp */
  animate?: boolean;
}

// 등장 연출 타이밍(초) — 기둥 간격은 분석 사주팔자와 같게, 둘째 분은 첫 분보다 조금 늦게, 배지는 두 분이 다 찍힌 뒤
const COL_GAP = 0.275;
const P2_LAG = 0.2;
const BADGE_AT = 0.85;
const stampAt = (sec: number | null) => (sec == null ? { className: "", style: {} } : { className: "ink-stamp", style: { animationDelay: `${sec}s` } });

function PersonCell({ pillar, delay = null }: { pillar: string; delay?: number | null }) {
  if (!pillar) {
    return (
      <div className="flex flex-col items-center leading-tight text-[var(--color-ink-faint)]">
        <span className="font-heading text-sm md:text-base font-bold">?</span>
        <span className="text-[9px]">시간 모름</span>
      </div>
    );
  }
  const stem = pillar[0] ?? "";
  const branch = pillar[1] ?? "";
  const stemColor = getElementInfo(STEM_ELEMENT[stem] ?? "").color;
  const branchColor = getElementInfo(BRANCH_ELEMENT[branch] ?? "").color;
  return (
    <div className="flex flex-col items-center leading-tight">
      <span className={`font-heading text-sm md:text-base font-bold ${stampAt(delay).className}`} style={{ color: stemColor, ...stampAt(delay).style }}>
        {STEM_KOR[stem] ?? stem}({stem})
      </span>
      <span className={`font-heading text-sm md:text-base font-bold ${stampAt(delay == null ? null : delay + 0.1).className}`} style={{ color: branchColor, ...stampAt(delay == null ? null : delay + 0.1).style }}>
        {BRANCH_KOR[branch] ?? branch}({branch})
      </span>
    </div>
  );
}

function RelationCell({ rels, delay = null }: { rels: PillarRelation[]; delay?: number | null }) {
  if (rels.length === 0) {
    return <span className="text-[var(--color-ink-faint)] text-sm leading-none">·</span>;
  }
  return (
    <div className={`flex flex-col items-center gap-0.5 ${delay == null ? "" : "score-pop"}`} style={delay == null ? undefined : { animationDelay: `${delay}s` }}>
      {rels.map((r, i) => {
        const m = KIND_META[r.kind];
        if (!m) return null;
        const sign = r.polarity > 0 ? "＋" : "−";
        return (
          <span
            key={i}
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border whitespace-nowrap inline-flex items-center gap-0.5"
            style={{ color: m.color, background: m.bg, borderColor: m.border }}
            title={`${r.label} · ${r.polarity > 0 ? "길(吉)" : "흉(凶)"}`}
          >
            <span className="font-bold opacity-80">{sign}</span>
            {m.label}
          </span>
        );
      })}
    </div>
  );
}

function formatLabel(label: string, kind: string): string {
  // label 은 "{ch1}{ch2} 천간합" 또는 "{b1}{b2} 반합(水)" 형식
  const ch1 = label[0] ?? "";
  const ch2 = label[1] ?? "";
  const rest = label.slice(2);
  const isStem = kind === "stem_combine" || kind === "stem_clash";
  const map = isStem ? STEM_KOR : BRANCH_KOR;
  const kor1 = map[ch1] ?? ch1;
  const kor2 = map[ch2] ?? ch2;
  return `${ch1}${ch2}(${kor1}${kor2})${rest}`;
}

export default function PillarPairDiagram({ p1, p2, relations, animate = false }: Props) {
  // COLUMN_HEADERS 순서(시→일→월→년, 화면 왼쪽부터)대로
  const colAt = (col: number, extra: number) => (animate ? col * COL_GAP + extra : null);
  const samePillarRels = (kor: string) =>
    relations.filter((r) => r.pillar1 === kor && r.pillar2 === kor);

  const groupedExplanations = COLUMN_HEADERS
    .map(({ kor }) => ({ pillar: kor, rels: samePillarRels(kor) }))
    .filter((g) => g.rels.length > 0);

  return (
    <div className="space-y-3">
    <div className="rounded-xl border border-[var(--color-border-light)] overflow-hidden">
      <table className="w-full text-center border-collapse" style={{ tableLayout: "fixed" }}>
        <thead>
          <tr style={{ backgroundColor: "var(--color-ivory)" }}>
            {COLUMN_HEADERS.map(({ kor, han }) => (
              <th
                key={kor}
                className="text-[10px] font-semibold text-[var(--color-ink-muted)] py-1.5 px-1"
              >
                {kor}({han})
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-[var(--color-border-light)]">
            {COLUMN_HEADERS.map(({ kor, origIndex }, col) => (
              <td key={`p1-${kor}`} className="py-2 px-1">
                <PersonCell pillar={p1.pillars[origIndex] ?? ""} delay={colAt(col, 0)} />
              </td>
            ))}
          </tr>
          <tr className="border-t border-[var(--color-border-light)]">
            {COLUMN_HEADERS.map(({ kor, origIndex }, col) => (
              <td key={`p2-${kor}`} className="py-2 px-1">
                <PersonCell pillar={p2.pillars[origIndex] ?? ""} delay={colAt(col, P2_LAG)} />
              </td>
            ))}
          </tr>
          <tr className="border-t border-[var(--color-border-light)]" style={{ backgroundColor: "var(--color-ivory)" }}>
            {COLUMN_HEADERS.map(({ kor }, col) => (
              <td key={`rel-${kor}`} className="py-1.5 px-1">
                <RelationCell rels={samePillarRels(kor)} delay={colAt(col, BADGE_AT)} />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>

      {/* 그림 아래 까치 팁은 기둥별 합·충·형·해·파 풀이만 — 서두 문장과 주오행 상생·상극 문단은 2026-10-18 뺐다(두 분의 캐릭터·오행 보완 카드와 겹침, 사용자 지시) */}
      <KkachiTip>
        {groupedExplanations.length === 0 ? (
          <>이번엔 같은 기둥에서 부딪치는 합·충은 없었어요.</>
        ) : (
          <>{groupedExplanations.map(({ pillar, rels }, pi) => {
            const summary = pickPillarSummary(rels);
            return (
              <span key={pillar}>
                {pi > 0 && " "}
                <span className="text-[var(--color-ink)]">{PILLAR_LEAD_IN[pillar] ?? pillar}</span>{" "}
                {rels.map((r, i) => {
                  const m = KIND_META[r.kind];
                  return (
                    <span key={i}>
                      {i > 0 && ", "}
                      <span style={{ color: m?.color ?? "var(--color-ink)" }}>{formatLabel(r.label, r.kind)}</span>
                    </span>
                  );
                })}
                {summary && <> — {summary}</>}.
              </span>
            );
          })}</>
        )}
      </KkachiTip>
    </div>
  );
}
