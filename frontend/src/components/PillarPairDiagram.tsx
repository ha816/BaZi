"use client";

import React from "react";
import type { PillarRelation, PillarSnapshot } from "@/types/analysis";
import { BRANCH_ELEMENT, BRANCH_KOR, STEM_ELEMENT, STEM_KOR } from "@/lib/ganji";
import { getElementInfo } from "@/lib/elementColors";
import KkachiTip from "./KkachiTip";

const OHENG_GENERATES: Record<string, string> = {
  "木": "火", "火": "土", "土": "金", "金": "水", "水": "木",
};
const OHENG_OVERCOMES: Record<string, string> = {
  "木": "土", "火": "金", "土": "水", "金": "木", "水": "火",
};

function describeMainElementRelation(
  p1Main: string, p2Main: string, name1: string, name2: string,
): React.ReactNode | null {
  if (!p1Main || !p2Main) return null;
  const info1 = getElementInfo(p1Main);
  const info2 = getElementInfo(p2Main);
  const el1 = <span style={{ color: info1.color }}>{p1Main}({info1.korean})</span>;
  const el2 = <span style={{ color: info2.color }}>{p2Main}({info2.korean})</span>;

  if (p1Main === p2Main) {
    return (
      <>
        두 분 모두 {el1} 기운을 주인공으로 가졌어요. 결이 비슷해 공감대는 넓지만, 같은 색끼리 부딪치면 경쟁심이 생길 수 있으니 서로의 영역을 인정해주는 게 좋아요.
      </>
    );
  }
  if (OHENG_GENERATES[p1Main] === p2Main) {
    return (
      <>
        {name1}님의 {el1}이 {name2}님의 {el2}을 키워주는 상생(相生) 관계예요. {name1}님이 자연스럽게 받쳐주고 {name2}님이 그 에너지로 빛나는, 위에서 흘려보내고 아래에서 받아 자라는 파트너예요.
      </>
    );
  }
  if (OHENG_GENERATES[p2Main] === p1Main) {
    return (
      <>
        {name2}님의 {el2}이 {name1}님의 {el1}을 키워주는 상생(相生) 관계예요. {name2}님이 토양을 만들어주면 {name1}님이 그 위에서 자라나며 서로 성장시켜주는 든든한 파트너예요.
      </>
    );
  }
  if (OHENG_OVERCOMES[p1Main] === p2Main) {
    return (
      <>
        {name1}님의 {el1}이 {name2}님의 {el2}을 다스리는 상극(相剋) 관계예요. 주도권 갈등은 있을 수 있지만, {name1}님이 {name2}님의 거친 면을 다듬어주고 방향을 잡아주는 자극이 강한 사이예요.
      </>
    );
  }
  if (OHENG_OVERCOMES[p2Main] === p1Main) {
    return (
      <>
        {name2}님의 {el2}이 {name1}님의 {el1}을 다스리는 상극(相剋) 관계예요. 긴장감과 마찰은 있지만, {name2}님이 {name1}님의 욕심을 잡아주며 강한 끌림으로 변화를 만드는 사이예요.
      </>
    );
  }
  return null;
}

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

const PILLAR_CONTEXT: Record<string, string> = {
  "시주": "자녀·노년",
  "일주": "본인·배우자",
  "월주": "부모·성장환경",
  "년주": "가문·사회 배경",
};

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
  name1: string;
  name2: string;
}

function PersonCell({ pillar }: { pillar: string }) {
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
      <span className="font-heading text-sm md:text-base font-bold" style={{ color: stemColor }}>
        {STEM_KOR[stem] ?? stem}({stem})
      </span>
      <span className="font-heading text-sm md:text-base font-bold" style={{ color: branchColor }}>
        {BRANCH_KOR[branch] ?? branch}({branch})
      </span>
    </div>
  );
}

function RelationCell({ rels }: { rels: PillarRelation[] }) {
  if (rels.length === 0) {
    return <span className="text-[var(--color-ink-faint)] text-sm leading-none">·</span>;
  }
  return (
    <div className="flex flex-col items-center gap-0.5">
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

export default function PillarPairDiagram({ p1, p2, relations, name1, name2 }: Props) {
  const samePillarRels = (kor: string) =>
    relations.filter((r) => r.pillar1 === kor && r.pillar2 === kor);

  const groupedExplanations = COLUMN_HEADERS
    .map(({ kor }) => ({ pillar: kor, rels: samePillarRels(kor) }))
    .filter((g) => g.rels.length > 0);

  const mainElementIntro = describeMainElementRelation(
    p1.my_main_element, p2.my_main_element, name1, name2,
  );

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
            {COLUMN_HEADERS.map(({ kor, origIndex }) => (
              <td key={`p1-${kor}`} className="py-2 px-1">
                <PersonCell pillar={p1.pillars[origIndex] ?? ""} />
              </td>
            ))}
          </tr>
          <tr className="border-t border-[var(--color-border-light)]">
            {COLUMN_HEADERS.map(({ kor, origIndex }) => (
              <td key={`p2-${kor}`} className="py-2 px-1">
                <PersonCell pillar={p2.pillars[origIndex] ?? ""} />
              </td>
            ))}
          </tr>
          <tr className="border-t border-[var(--color-border-light)]" style={{ backgroundColor: "var(--color-ivory)" }}>
            {COLUMN_HEADERS.map(({ kor }) => (
              <td key={`rel-${kor}`} className="py-1.5 px-1">
                <RelationCell rels={samePillarRels(kor)} />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>

      <KkachiTip>
        두 분의 사주팔자를 위·아래로 나란히 펼쳤어요.
        {mainElementIntro && (
          <>
            <span className="block mt-1.5" />
            <span className="block">{mainElementIntro}</span>
            <span className="block mt-1.5" />
          </>
        )}
        {groupedExplanations.length === 0 ? (
          <> 이번엔 같은 기둥에서 부딪치는 합·충은 없었어요.</>
        ) : (
          <> {groupedExplanations.map(({ pillar, rels }, pi) => {
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
