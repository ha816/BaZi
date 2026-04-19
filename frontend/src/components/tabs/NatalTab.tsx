"use client";

import { useState, useEffect } from "react";
import type { NatalResult, SipsinInfo, SibiUnseongInfo, SinsalInfo } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";
import PillarDetail from "@/components/PillarDetail";
import SectionHeader from "@/components/SectionHeader";
import KkachiTip from "@/components/KkachiTip";
import ElementRadar from "@/components/ElementRadar";


const SIPSIN_ARROW: Record<string, { label: string; dir: "to-me" | "from-me" | "same"; color: string }> = {
  "比肩": { label: "같은 기운", dir: "same",    color: "#78716C" },
  "劫財": { label: "같은 기운", dir: "same",    color: "#78716C" },
  "食神": { label: "내가 낳음", dir: "from-me", color: "#1B6B3A" },
  "傷官": { label: "내가 낳음", dir: "from-me", color: "#1B6B3A" },
  "偏財": { label: "내가 꺾음", dir: "from-me", color: "#B02020" },
  "正財": { label: "내가 꺾음", dir: "from-me", color: "#B02020" },
  "偏官": { label: "나를 꺾음", dir: "to-me",   color: "#B02020" },
  "正官": { label: "나를 꺾음", dir: "to-me",   color: "#B02020" },
  "偏印": { label: "나를 키움", dir: "to-me",   color: "#1B6B3A" },
  "正印": { label: "나를 키움", dir: "to-me",   color: "#1B6B3A" },
};

interface Props {
  natal: NatalResult;
  name: string;
}

/* ── 십신 정보 ── */
const SIPSIN_INFO: Record<string, { korean: string; tagline: string; desc: string }> = {
  "比肩": { korean: "비견", tagline: "든든한 내 편, 강한 고집",    desc: "주체성이 강하고 자기 주관대로 밀고 나가는 힘" },
  "劫財": { korean: "겁재", tagline: "선의의 경쟁자",              desc: "남에게 지기 싫어하는 승부욕과 강한 추진력" },
  "食神": { korean: "식신", tagline: "전문가적 기질",              desc: "하나를 깊게 파고드는 연구심과 풍요의 기운" },
  "傷官": { korean: "상관", tagline: "천재적인 표현력",            desc: "임기응변이 뛰어나고 기존 틀을 깨는 혁신적 아이디어" },
  "正財": { korean: "정재", tagline: "성실한 자산가",              desc: "꼬박꼬박 들어오는 고정 수입과 안정적인 관리 능력" },
  "偏財": { korean: "편재", tagline: "통 큰 사업가",              desc: "큰 재물이나 기회를 포착하는 수완과 유연함" },
  "正官": { korean: "정관", tagline: "바른 생활 리더",             desc: "원칙을 중시하고 조직 내에서 신뢰받는 명예와 직위" },
  "偏官": { korean: "편관", tagline: "카리스마 넘치는 해결사",     desc: "강한 책임감과 어려운 난관을 돌파하는 권력 의지" },
  "正印": { korean: "정인", tagline: "사랑받는 학자",              desc: "정통적인 지식 습득과 윗사람에게 보살핌받는 기운" },
  "偏印": { korean: "편인", tagline: "독창적인 전략가",            desc: "비주류 지식과 기술을 습득하는 직관력과 창의성" },
};

/* ── 십이운성 정보 ── */
const UNSEONG_PHASE: Record<string, { label: string; color: string; bg: string }> = {
  성장기: { label: "🌱 성장기", color: "#5B8C6A", bg: "#EEF4F0" },
  번영기: { label: "👑 번영기", color: "#B8945A", bg: "#F5F0E7" },
  수렴기: { label: "🌙 수렴기", color: "#4A7BA5", bg: "#ECF1F6" },
  태동기: { label: "🔄 태동기", color: "#7E7E8A", bg: "#F0F0F2" },
};

const UNSEONG_INFO: Record<string, { korean: string; phase: string; tagline: string; desc: string }> = {
  "長生": { korean: "장생", phase: "성장기", tagline: "갓 태어난 아기",      desc: "새로운 시작, 주변의 도움과 사랑을 받는 기운" },
  "沐浴": { korean: "목욕", phase: "성장기", tagline: "화려한 아이",          desc: "호기심 왕성, 주목받고 싶어 하는 에너지" },
  "冠帶": { korean: "관대", phase: "성장기", tagline: "질풍노도의 청년",      desc: "의욕이 앞서고 추진력이 폭발하는 시기" },
  "建祿": { korean: "건록", phase: "번영기", tagline: "자립하는 성인",        desc: "스스로의 힘으로 안정적인 기반을 닦는 탄탄한 기운" },
  "帝旺": { korean: "제왕", phase: "번영기", tagline: "인생의 황금기",        desc: "에너지의 정점, 최고의 권위와 지배력을 발휘" },
  "衰":   { korean: "쇠",   phase: "번영기", tagline: "노련한 원로",          desc: "힘은 지났지만 경험과 지혜로 여유롭게 조율" },
  "病":   { korean: "병",   phase: "수렴기", tagline: "감수성 깊은 노인",     desc: "활동력은 줄지만 감수성과 동정심이 깊어지는 단계" },
  "死":   { korean: "사",   phase: "수렴기", tagline: "고요한 멈춤",          desc: "겉의 움직임은 없으나 내면의 집중력이 극대화" },
  "墓":   { korean: "묘",   phase: "수렴기", tagline: "에너지의 저장소",      desc: "내실을 다지고 절약하며 미래를 준비하는 시기" },
  "絕":   { korean: "절",   phase: "태동기", tagline: "완전한 끊어짐",        desc: "과거 정리 후 새로운 반전을 꿈꾸는 드라마틱한 지점" },
  "胎":   { korean: "태",   phase: "태동기", tagline: "수정란의 가능성",      desc: "새 생명이 잉태된 상태, 무한한 가능성의 시작" },
  "養":   { korean: "양",   phase: "태동기", tagline: "태아의 평온한 기다림", desc: "안전하게 보호받으며 세상 밖으로 나갈 준비" },
};

function buildSipsinNarrative(sipsin: SipsinInfo[], name: string): string {
  if (sipsin.length === 0) return "";
  const seen = new Set<string>();
  const unique = sipsin.filter((s) => {
    if (seen.has(s.sipsin_name)) return false;
    seen.add(s.sipsin_name);
    return true;
  });
  const list = unique
    .map((s) => {
      const info = SIPSIN_INFO[s.sipsin_name];
      return info ? `${info.korean}(${info.tagline})` : s.sipsin_name;
    })
    .join(", ");
  const prefix = name ? `${name}님` : "이 사주";
  const top = unique[0];
  const topInfo = SIPSIN_INFO[top.sipsin_name];
  const detail = topInfo ? ` ${topInfo.desc}.` : "";
  return `${prefix} 사주에는 ${list} 기운이 담겨 있어요.${detail}`;
}

/* ── 십이운성 ── */
const STRONG_UNSEONG = new Set(["建祿", "帝旺", "冠帶", "長生"]);
const WEAK_UNSEONG = new Set(["病", "死", "絕"]);

function buildUnseongSummary(sibiUnseong: SibiUnseongInfo[], name: string): string {
  const strongCount = sibiUnseong.filter((u) => STRONG_UNSEONG.has(u.unseong_name)).length;
  const weakCount = sibiUnseong.filter((u) => WEAK_UNSEONG.has(u.unseong_name)).length;
  const p = name ? `${name}님은 ` : "";
  if (strongCount >= 3) return `${p}전반적으로 에너지가 충만한 사주예요. 타고난 실력을 마음껏 발휘할 수 있는 상태입니다.`;
  if (strongCount >= 2) return `${p}대체로 안정적인 에너지 흐름이에요. 꾸준히 성장하면서 성과를 낼 수 있는 타입입니다.`;
  if (weakCount >= 2) return `${p}에너지가 다소 약한 편이에요. 무리하기보다 전략적으로 움직이며 에너지를 아끼는 게 좋아요.`;
  return `${p}에너지 흐름에 굴곡이 있는 편이에요. 시기에 따라 컨디션 차이가 클 수 있으니 몸 관리에 신경 쓰면 좋겠어요.`;
}

function buildUnseongDetail(sibiUnseong: SibiUnseongInfo[]): string {
  const detail = sibiUnseong
    .map((u) => `${u.pillar}와는 ${UNSEONG_INFO[u.unseong_name]?.korean ?? u.unseong_name}`)
    .join(", ");
  return `${detail}에 해당해요.`;
}

/* ── 신살 ── */
const SINSAL_INFO: Record<string, { hanja: string; tagline: string; desc: string; color: string; bg: string; border: string }> = {
  "도화살":   { hanja: "桃花殺",   tagline: "복숭아꽃의 향기",      color: "#C06B8A", bg: "#F7EFF3", border: "#E0B5C8", desc: "가만히 있어도 시선이 모이는 강력한 매력과 스타성. 퍼스널 브랜딩·마케팅·예술 분야에서 타고난 강점을 발휘합니다." },
  "역마살":   { hanja: "驛馬殺",   tagline: "지치지 않는 엔진",     color: "#5B8C6A", bg: "#EEF4F0", border: "#A8C9B5", desc: "한곳에 머물기보다 끊임없이 움직이고 새 환경을 개척할 때 운이 풀립니다. 해외·여행·유통 분야에서 빛납니다." },
  "화개살":   { hanja: "華蓋殺",   tagline: "화려한 덮개",          color: "#7B68A0", bg: "#F2F0F7", border: "#C5BCDB", desc: "예술적 감수성과 종교·철학적 깊이가 있는 에너지. 고독해 보이지만 창의성과 전문 지식이 깊은 학자·아티스트의 기운." },
  "천을귀인": { hanja: "天乙貴人", tagline: "최고의 조력자",        color: "#B8945A", bg: "#F5F0E7", border: "#D9C49A", desc: "위기의 순간 귀인이 나타나거나 큰 화를 면하게 해주는 가장 복된 기운. 사람 복이 많고 고비마다 도움의 손길이 찾아옵니다." },
  "문창귀인": { hanja: "文昌貴人", tagline: "문서와 학문의 별",     color: "#4A7BA5", bg: "#ECF1F6", border: "#9BB8D0", desc: "시험·자격증·학업 운이 강하고 문서 처리 능력이 뛰어납니다. 지식으로 인정받고 전문성을 쌓아나가는 기운." },
  "장성살":   { hanja: "將星殺",   tagline: "대장군의 기개",        color: "#8B6A3E", bg: "#F5EFE5", border: "#C9A96E", desc: "대중을 압도하는 카리스마와 결단력. 리더십이 강하고 큰일을 도모할 때 발휘되는 강력한 에너지." },
  "백호살":   { hanja: "白虎殺",   tagline: "백호의 폭발적 집중력", color: "#C75B52", bg: "#F7EDEC", border: "#E0A8A3", desc: "에너지가 워낙 강해서 사고나 급변을 주의해야 하지만, 전문직에서 폭발적인 집중력으로 남들이 못 하는 일을 해냅니다." },
};

const SINSAL_ORDER = ["도화살", "역마살", "화개살", "천을귀인", "문창귀인", "장성살", "백호살"];

function buildSinsalNarrative(sinsal: SinsalInfo[], name: string): string {
  const p = name ? `${name}님` : "이 사주";
  if (sinsal.length === 0) return "";
  const names = [...new Set(sinsal.map((s) => s.sinsal_korean))].join(", ");
  return `${p} 사주에 ${names}이 있어요. 이 특별한 기운을 잘 활용하면 타고난 캐릭터성을 살릴 수 있어요.`;
}

const OHAENG_IDX: Record<string, number> = { '木':0, '火':1, '土':2, '金':3, '水':4 };
const OHAENG_KOR = ['나무','불','흙','쇠','물'];
const OHAENG_COLORS = ['#1B6B3A','#B02020','#8A4F00','#3D3D3D','#0F4F8A'];
const OHAENG_BGS = ['#C8E6D4','#F8CCC8','#F5DCAA','#E0E0E0','#C4DDF5'];
const OHAENG_BORDERS = ['#6DB890','#E07070','#D4A060','#A0A0A0','#6AAAD8'];
const SAENG_PAIRS: [number,number][] = [[0,1],[1,2],[2,3],[3,4],[4,0]];
const GEUK_PAIRS: [number,number][] = [[0,2],[1,3],[2,4],[3,0],[4,1]];

function OhaengCountDiagram({ stats }: { stats: Record<string, number> }) {
  const CX = 100, CY = 88, PR = 66, NR = 20;
  function pentaPos(i: number): [number, number] {
    const a = (-90 + i * 72) * Math.PI / 180;
    return [CX + PR * Math.cos(a), CY + PR * Math.sin(a)];
  }
  function arrowSeg(i1: number, i2: number) {
    const [x1,y1] = pentaPos(i1), [x2,y2] = pentaPos(i2);
    const dx = x2-x1, dy = y2-y1, l = Math.sqrt(dx*dx+dy*dy);
    const ux = dx/l, uy = dy/l;
    return { x1: x1+NR*ux, y1: y1+NR*uy, x2: x2-(NR+4)*ux, y2: y2-(NR+4)*uy };
  }
  const maxCount = Math.max(1, ...Object.values(stats));
  return (
    <div className="rounded-lg bg-[var(--color-ivory)] border border-[var(--color-border-light)] p-3 space-y-2">
      <p className="text-[10px] font-semibold text-[var(--color-ink-muted)]">오행 관계도</p>
      <svg viewBox="0 0 200 182" className="w-2/3 mx-auto block">
        <defs>
          <marker id="oc-saeng" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L5,2.5 z" fill="#1B6B3A" opacity="0.4" />
          </marker>
          <marker id="oc-geuk" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L5,2.5 z" fill="#C0392B" opacity="0.3" />
          </marker>
        </defs>
        {SAENG_PAIRS.map(([a,b]) => {
          const s = arrowSeg(a,b);
          return <line key={`s${a}${b}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke="#1B6B3A" strokeWidth={1} strokeOpacity={0.2} markerEnd="url(#oc-saeng)" />;
        })}
        {GEUK_PAIRS.map(([a,b]) => {
          const s = arrowSeg(a,b);
          return <line key={`g${a}${b}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke="#C0392B" strokeWidth={1} strokeOpacity={0.15} strokeDasharray="4,3" markerEnd="url(#oc-geuk)" />;
        })}
        {(['木','火','土','金','水'] as const).map((elem, i) => {
          const [x,y] = pentaPos(i);
          const count = stats[elem] ?? 0;
          const active = count > 0;
          const ratio = active ? count / maxCount : 0;
          const strokeW = active ? 1.5 + 2.5 * ratio : 1;
          return (
            <g key={elem}>
              <circle cx={x} cy={y} r={NR}
                fill={active ? OHAENG_BGS[i] : '#F5F2EC'}
                stroke={OHAENG_BORDERS[i]}
                strokeWidth={strokeW}
                opacity={active ? 0.55 + 0.45 * ratio : 0.25} />
              <text x={x} y={y-4} textAnchor="middle" dominantBaseline="middle"
                fontSize={14} fontWeight={active ? 700 : 400}
                fill={OHAENG_COLORS[i]} opacity={active ? 1 : 0.3}
                style={{ fontFamily: "serif" }}>
                {elem}
              </text>
              <text x={x} y={y+7} textAnchor="middle" dominantBaseline="middle"
                fontSize={8} fill={OHAENG_COLORS[i]} opacity={active ? 0.85 : 0.25}>
                {OHAENG_KOR[i]}
              </text>
              {active && (
                <text x={x} y={y+NR+10} textAnchor="middle"
                  fontSize={9} fontWeight={700} fill={OHAENG_COLORS[i]}>
                  {count}개
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-1.5">
          <svg width="20" height="8"><line x1="0" y1="4" x2="14" y2="4" stroke="#1B6B3A" strokeWidth="1.5" markerEnd="url(#oc-saeng)" /></svg>
          <span className="text-[9px] text-[#1B6B3A] font-medium">도움(生)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="20" height="8"><line x1="0" y1="4" x2="14" y2="4" stroke="#C0392B" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#oc-geuk)" /></svg>
          <span className="text-[9px] text-[#C0392B] font-medium">억제(克)</span>
        </div>
      </div>
    </div>
  );
}

const PILLAR_SHORT = ["년주", "월주", "일주", "시주"];

const ELEMENT_TIP: Record<string, { strength: string; caution: string; advice: string }> = {
  木: { strength: "진취적인 추진력과 창의성",  caution: "성급함과 지속력 부족",       advice: "꾸준히 뿌리를 내리는 과정을 즐긴다면 큰 성장을 이룰 수 있어요." },
  火: { strength: "열정과 뛰어난 표현력",      caution: "감정 기복과 충동적인 결정",   advice: "열정을 유지하면서도 차분히 결과를 살피는 습관을 들이면 더욱 빛납니다." },
  土: { strength: "신중함과 책임감",           caution: "보수성과 변화에 대한 저항",   advice: "자신의 안정감을 바탕으로 타인을 배려하는 마음을 더한다면 더욱 발전할 수 있어요." },
  金: { strength: "결단력과 원칙에 대한 의지", caution: "지나친 고집과 냉정함",        advice: "원칙을 지키면서도 유연하게 소통한다면 주변의 신뢰를 더욱 얻게 됩니다." },
  水: { strength: "뛰어난 지혜와 유연한 적응력", caution: "우유부단함과 과도한 걱정", advice: "깊은 통찰력을 믿고 흐름에 몸을 맡기면 자연스럽게 길이 열려요." },
};

function buildOhaengTip(natal: NatalResult, name: string): string {
  const elem = natal.my_element.name;
  const meaning = natal.my_element.meaning;
  const tip = ELEMENT_TIP[elem];
  if (!tip) return "";
  const p = name ? `${name}님은 ` : "";
  return `${p}${meaning}(${elem}) 기운으로서 ${tip.strength}을 잘 발휘하시되, ${tip.caution}에 주의하세요. ${tip.advice}`;
}

const STEM_KOR: Record<string, string> = {
  甲:"갑", 乙:"을", 丙:"병", 丁:"정", 戊:"무",
  己:"기", 庚:"경", 辛:"신", 壬:"임", 癸:"계",
};

const STRENGTH_DESC: Record<string, string> = {
  신강: "타고난 에너지가 강하고 자기 주도적인 성향이에요.",
  신약: "주변 환경의 영향을 잘 받고 협력에서 힘을 발휘해요.",
  중화: "기운이 고르게 균형 잡혀 안정적인 사주예요.",
};

function buildPillarTip(natal: NatalResult, name: string): string {
  const p = name ? `${name}님을 ` : "이 사주를 ";
  const kor = STEM_KOR[natal.day_stem] ?? natal.day_stem;
  const personal = `${p}나타내는 글자는 ${kor}(${natal.day_stem})이에요.`;
  const concept = "태어난 날(日柱)의 천간(天干)이 자신을 나타냅니다.";
  const strengthDesc = STRENGTH_DESC[natal.strength_label] ?? "";
  return [personal, concept, strengthDesc].filter(Boolean).join(" ");
}

function OhaengSourceBreakdown({ pillars, pillarElements, stats }: {
  pillars: string[];
  pillarElements: { stem_element: string; branch_element: string }[];
  stats: Record<string, number>;
}) {
  const ELEMS = ['木', '火', '土', '金', '水'];
  const sources: Record<string, { char: string; pillar: string; type: string }[]> = {};
  ELEMS.forEach((e) => (sources[e] = []));
  pillars.forEach((pillar, i) => {
    const stem = pillar[0], branch = pillar[1];
    const stemEl = pillarElements[i]?.stem_element;
    const branchEl = pillarElements[i]?.branch_element;
    if (stemEl) sources[stemEl].push({ char: stem, pillar: PILLAR_SHORT[i], type: "천간" });
    if (branchEl) sources[branchEl].push({ char: branch, pillar: PILLAR_SHORT[i], type: "지지" });
  });
  const maxCount = Math.max(1, ...Object.values(stats));
  return (
    <div className="space-y-2">
      {ELEMS.map((elem, i) => {
        const count = stats[elem] ?? 0;
        const active = count > 0;
        const pct = (count / maxCount) * 100;
        return (
          <div key={elem} className={`space-y-1 ${active ? "" : "opacity-30"}`}>
            <div className="flex items-center gap-2">
              <span className="font-heading text-sm font-bold w-5 shrink-0" style={{ color: OHAENG_COLORS[i] }}>{elem}</span>
              <div className="flex-1 h-2 rounded-full bg-[var(--color-border-light)] overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: OHAENG_COLORS[i] }} />
              </div>
              <span className="text-[10px] font-semibold w-6 text-right" style={{ color: OHAENG_COLORS[i] }}>{count}</span>
            </div>
            {active && (
              <div className="flex flex-wrap gap-1 pl-7">
                {sources[elem].map((s, j) => (
                  <span key={j} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: OHAENG_BGS[i], color: OHAENG_COLORS[i], border: `1px solid ${OHAENG_BORDERS[i]}` }}>
                    {s.char} {s.pillar} {s.type}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const SINSAL_COMBOS: { needs: string[]; message: string }[] = [
  { needs: ["문창귀인", "장성살"],    message: "똑똑한 리더 탄생! 지략과 카리스마를 모두 갖춘 당신은 조직의 핵심이 될 상이네요!" },
  { needs: ["도화살", "역마살"],      message: "카리스마 넘치는 글로벌 스타! 어딜 가도 주목받고, 낯선 곳에서 오히려 더 빛나는 타입이에요." },
  { needs: ["천을귀인", "문창귀인"],  message: "귀인의 도움으로 빛나는 학자! 배움의 길에서 뜻밖의 좋은 사람을 계속 만나게 돼요." },
  { needs: ["도화살", "장성살"],      message: "매력적인 리더! 인기와 권위를 동시에 갖춘 드문 조합이에요. 무대가 클수록 빛납니다." },
  { needs: ["역마살", "천을귀인"],    message: "움직일수록 귀인이 나타나는 타입이에요. 새로운 환경이 새로운 행운을 데려옵니다." },
];

export default function NatalTab({ natal, name }: Props) {
  const meInfo = getElementInfo(natal.my_element.name);
  const [sajuOpen, setSajuOpen] = useState(false);
  const [ohengOpen, setOhengOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("kkachi_concept_saju") === "open") setSajuOpen(true);
    if (localStorage.getItem("kkachi_concept_oheng") === "open") setOhengOpen(true);
  }, []);

  const toggleSaju = () => { const next = !sajuOpen; setSajuOpen(next); localStorage.setItem("kkachi_concept_saju", next ? "open" : "closed"); };
  const toggleOheng = () => { const next = !ohengOpen; setOhengOpen(next); localStorage.setItem("kkachi_concept_oheng", next ? "open" : "closed"); };

  return (
    <div className="space-y-4">
      {/* 사주팔자 + 오행 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <div className="flex items-center gap-2">
            <SectionHeader title="사주팔자(四柱八字)" noMargin />
            <button type="button" onClick={toggleSaju} className="text-[10px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink-muted)] transition-colors flex items-center gap-0.5">
              설명 <span>{sajuOpen ? "▲" : "▼"}</span>
            </button>
          </div>
          {sajuOpen && (
            <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed mt-2">
              태어난 <strong className="text-[var(--color-ink)]">연·월·일·시</strong>를 각각 하늘(천간)과 땅(지지) 두 글자로 표현한 것이 <strong className="text-[var(--color-ink)]">사주(四柱)</strong>, 그 여덟 글자를 <strong className="text-[var(--color-ink)]">팔자(八字)</strong>라 부릅니다.
            </p>
          )}
        </div>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          <PillarDetail
            pillars={natal.pillars}
            dayStem={natal.day_stem}
            basic
          />
          <KkachiTip>{buildPillarTip(natal, name)}</KkachiTip>
        </div>
        <div className="divider" />
        <div className="slide-card__header">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">오행(五行)</h3>
            <button type="button" onClick={toggleOheng} className="text-[10px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink-muted)] transition-colors flex items-center gap-0.5">
              설명 <span>{ohengOpen ? "▲" : "▼"}</span>
            </button>
          </div>
          {ohengOpen && (
            <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed mt-2">
              만물을 이루는 다섯 가지 기운 — <strong className="text-[var(--color-ink)]">木(나무)·火(불)·土(흙)·金(쇠)·水(물)</strong>. 사주 여덟 글자 각각은 이 오행 중 하나에 속하며, 어떤 기운이 많고 적은지에 따라 성격·체질·적성이 달라집니다.
            </p>
          )}
        </div>
        <div className="divider" />
        <div className="slide-card__body space-y-5">
          <OhaengSourceBreakdown pillars={natal.pillars} pillarElements={natal.pillar_elements} stats={natal.element_stats} />
          <OhaengCountDiagram stats={natal.element_stats} />
          <KkachiTip>{buildOhaengTip(natal, name)}</KkachiTip>
          {(() => {
            const maxVal = Math.max(...Object.values(natal.element_stats));
            const tops = Object.entries(natal.element_stats).filter(([, v]) => v === maxVal).map(([k]) => k);
            return tops.length === 1 ? (
              <img src={`/oheng/oheng_${tops[0]}.png`} alt={tops[0]} className="w-full rounded-xl object-cover" style={{ height: 275 }} />
            ) : (
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${tops.length}, 1fr)` }}>
                {tops.map((el) => (
                  <img key={el} src={`/oheng/oheng_${el}.png`} alt={el} className="w-full rounded-lg object-cover" style={{ height: 275 }} />
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* 지장간 */}
      {natal.jizan_gan?.some((jg) => jg.length > 0) && (
        <div className="slide-card">
          <div className="slide-card__header">
            <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">지장간(地藏干)</h3>
            <p className="text-xs text-[var(--color-ink-faint)] mt-1 leading-relaxed">
              각 지지(땅 글자) 안에 숨어있는 천간들. 사주의 <strong className="text-[var(--color-ink-muted)]">잠재된 기운과 속마음</strong>을 나타냅니다.
            </p>
          </div>
          <div className="divider" />
          <div className="slide-card__body">
            <div className="grid grid-cols-4 gap-2">
              {[3, 2, 1, 0].map((origI) => {
                const PILLAR_LABELS_SHORT = ["年柱", "月柱", "日柱", "時柱"];
                const jg = natal.jizan_gan[origI] ?? [];
                const SIPSIN_KOR: Record<string, string> = {
                  比肩: "비견", 劫財: "겁재", 食神: "식신", 傷官: "상관",
                  偏財: "편재", 正財: "정재", 偏官: "편관", 正官: "정관",
                  偏印: "편인", 正印: "정인",
                };
                return (
                  <div key={origI} className="rounded-xl border text-center px-2 py-3 space-y-1.5" style={{ borderColor: "var(--color-border-light)", backgroundColor: "var(--color-card)" }}>
                    <div className="text-[10px] font-semibold text-[var(--color-ink-faint)]">{PILLAR_LABELS_SHORT[origI]}</div>
                    {jg.length > 0 ? jg.map((item, i) => (
                      <div key={i} className="text-xs text-[var(--color-ink)]">
                        {item.stem}
                        <span className="text-[10px] text-[var(--color-ink-faint)] ml-0.5">
                          {SIPSIN_KOR[item.sipsin_name] ?? item.sipsin_name}
                        </span>
                      </div>
                    )) : <div className="text-xs text-[var(--color-ink-faint)]">—</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 공망 */}
      {natal.gongmang?.some(Boolean) && (
        <div className="slide-card">
          <div className="slide-card__header">
            <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">공망(空亡)</h3>
          </div>
          <div className="divider" />
          <div className="slide-card__body space-y-3">
            <p className="text-xs text-[var(--color-ink-faint)] leading-relaxed">
              60갑자 순(旬)에서 짝이 없는 지지. 해당 기둥의 기운이 약해지지만, <strong className="text-[var(--color-ink-muted)]">집착을 내려놓을수록 오히려 잘 풀리는 기운</strong>으로 봅니다.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[3, 2, 1, 0].map((origI) => {
                const PILLAR_LABELS_SHORT = ["年柱", "月柱", "日柱", "時柱"];
                const isGongmang = natal.gongmang[origI];
                return (
                  <div key={origI} className="rounded-xl border text-center px-2 py-3"
                    style={isGongmang
                      ? { borderColor: "var(--color-ink-faint)", backgroundColor: "var(--color-ivory-warm)" }
                      : { borderColor: "var(--color-border-light)", backgroundColor: "var(--color-card)", opacity: 0.4 }
                    }
                  >
                    <div className="text-[10px] font-semibold text-[var(--color-ink-faint)]">{PILLAR_LABELS_SHORT[origI]}</div>
                    <div className="text-sm font-bold mt-1" style={{ color: isGongmang ? "var(--color-ink)" : "var(--color-ink-faint)" }}>
                      {isGongmang ? "空亡" : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 십신 */}
      {natal.sipsin.length > 0 && (
        <div className="slide-card">
          <div className="slide-card__header">
            <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">십신(十神) 구성</h3>
            <p className="text-xs text-[var(--color-ink-faint)] mt-1 leading-relaxed">
              일간(나)과 나머지 7글자의 관계를 10가지로 분류한 것으로,
              <strong className="text-[var(--color-ink-muted)]"> 내가 가진 사회적 무기와 인간관계의 양상</strong>을 나타냅니다.
            </p>
          </div>
          <div className="divider" />
          <div className="slide-card__body">
            {/* 일간 기준 배너 */}
            <div className="flex items-center gap-2.5 mb-4 px-3 py-2 rounded-lg border"
              style={{ backgroundColor: meInfo.bgColor, borderColor: meInfo.borderColor }}>
              <div className="flex flex-col items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                style={{ backgroundColor: meInfo.bgColor, border: `1.5px solid ${meInfo.borderColor}` }}>
                <span className="font-heading text-base font-bold leading-none" style={{ color: meInfo.color }}>
                  {natal.day_stem}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--color-ink-faint)]">십신의 기준 · 일간(日干)</span>
                <p className="text-xs font-semibold" style={{ color: meInfo.color }}>
                  나를 나타내는 글자 — {meInfo.korean}({meInfo.label})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {Object.entries(
                natal.sipsin.reduce<Record<string, { sipsin_name: string; chars: string[]; element: string; count: number }>>(
                  (acc, s) => {
                    if (!acc[s.sipsin_name]) acc[s.sipsin_name] = { sipsin_name: s.sipsin_name, chars: [], element: s.element, count: 0 };
                    acc[s.sipsin_name].chars.push(s.char);
                    acc[s.sipsin_name].count++;
                    return acc;
                  }, {}
                )
              ).map(([sipsinName, group]) => {
                const info = SIPSIN_INFO[sipsinName];
                const arrow = SIPSIN_ARROW[sipsinName];
                const meEl = getElementInfo(natal.my_element.name);
                const targetEl = getElementInfo(group.element);
                const leftInfo  = arrow?.dir === "to-me" ? targetEl : meEl;
                const rightInfo = arrow?.dir === "to-me" ? meEl     : targetEl;
                const leftLabel = arrow?.dir === "to-me" ? group.element : natal.my_element.name;
                const rightLabel= arrow?.dir === "to-me" ? natal.my_element.name : group.element;
                return (
                  <div key={sipsinName} className="rounded-lg p-3 bg-[var(--color-ivory)] border border-[var(--color-border-light)]">
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="font-heading text-base font-bold text-[var(--color-ink)]">
                        {info?.korean ?? sipsinName}
                        <span className="text-xs font-normal text-[var(--color-ink-faint)] ml-1">({sipsinName})</span>
                      </div>
                      {group.count > 1 && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--color-gold-faint)] text-[var(--color-gold)] border border-[var(--color-gold-light)] flex-shrink-0">
                          ×{group.count}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-medium text-[var(--color-gold)] mb-1">{info?.tagline}</p>
                    <p className="text-[10px] text-[var(--color-ink-faint)] leading-snug">{info?.desc}</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {group.chars.map((ch, i) => (
                        <span key={i} className="font-heading text-sm font-bold text-[var(--color-ink-muted)]">{ch}</span>
                      ))}
                    </div>
                    {/* 미니 관계 다이어그램 */}
                    {arrow && (
                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[var(--color-border-light)]">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: leftInfo.bgColor, color: leftInfo.color }}>
                          {leftLabel}
                        </span>
                        <span className="text-[9px] font-semibold flex-1 text-center" style={{ color: arrow.color }}>
                          {arrow.label} →
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: rightInfo.bgColor, color: rightInfo.color }}>
                          {rightLabel}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <KkachiTip>{buildSipsinNarrative(natal.sipsin, name)}</KkachiTip>
          </div>
        </div>
      )}

      {/* 십이운성 */}
      {natal.sibi_unseong.length > 0 && (
        <div className="slide-card">
          <div className="slide-card__header">
            <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">십이운성(十二運星)</h3>
            <p className="text-xs text-[var(--color-ink-faint)] mt-1 leading-relaxed">
              사주팔자의 각 글자가 처한
              <strong className="text-[var(--color-ink-muted)]"> 에너지의 강약과 생로병사의 흐름</strong>을 12단계로 표현한 개념입니다.
            </p>
          </div>
          <div className="divider" />
          <div className="slide-card__body space-y-4">
            {/* 일간 기준 배너 */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border"
              style={{ backgroundColor: meInfo.bgColor, borderColor: meInfo.borderColor }}>
              <div className="flex flex-col items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                style={{ backgroundColor: meInfo.bgColor, border: `1.5px solid ${meInfo.borderColor}` }}>
                <span className="font-heading text-base font-bold leading-none" style={{ color: meInfo.color }}>
                  {natal.day_stem}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--color-ink-faint)]">십이운성의 기준 · 일간(日干)</span>
                <p className="text-xs font-semibold" style={{ color: meInfo.color }}>
                  나를 나타내는 글자 — {meInfo.korean}({meInfo.label})
                </p>
              </div>
            </div>

            {(["성장기", "번영기", "수렴기", "태동기"] as const).map((phaseName) => {
              const phase = UNSEONG_PHASE[phaseName];
              // 이 단계의 모든 운성 (순서 유지)
              const allInPhase = Object.entries(UNSEONG_INFO)
                .filter(([, v]) => v.phase === phaseName)
                .map(([key]) => key);
              // 사용자 운성 집계
              const myMap = natal.sibi_unseong.reduce<Record<string, string[]>>((acc, u) => {
                if (!acc[u.unseong_name]) acc[u.unseong_name] = [];
                acc[u.unseong_name].push(u.pillar);
                return acc;
              }, {});

              return (
                <div key={phaseName}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-px" style={{ backgroundColor: phase.color }} />
                    <span className="text-xs font-semibold" style={{ color: phase.color }}>
                      {phase.label}
                    </span>
                    <div className="flex-1 h-px" style={{ backgroundColor: phase.bg }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {allInPhase.map((unseongName) => {
                      const info = UNSEONG_INFO[unseongName];
                      const myPillars = myMap[unseongName];
                      const isMatch = !!myPillars;
                      return (
                        <div
                          key={unseongName}
                          className="rounded-lg p-2.5 border transition-opacity"
                          style={isMatch
                            ? { backgroundColor: phase.bg, borderColor: phase.color + "60" }
                            : { backgroundColor: "var(--color-ivory)", borderColor: "var(--color-border-light)", opacity: 0.35 }
                          }
                        >
                          {isMatch && (
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex gap-1 flex-wrap">
                                {myPillars.map((p, i) => (
                                  <span key={i} className="text-[10px] font-medium" style={{ color: phase.color }}>{p}</span>
                                ))}
                              </div>
                              {myPillars.length > 1 && (
                                <span className="text-[10px] font-bold px-1 py-0.5 rounded"
                                  style={{ color: phase.color, backgroundColor: phase.color + "20" }}>
                                  ×{myPillars.length}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="font-heading text-sm font-bold" style={{ color: isMatch ? "var(--color-ink)" : "var(--color-ink-faint)" }}>
                            {info.korean}
                            <span className="text-[10px] font-normal text-[var(--color-ink-faint)] ml-0.5">({unseongName})</span>
                          </div>
                          {isMatch && (
                            <>
                              <p className="text-[10px] font-medium mt-0.5" style={{ color: phase.color }}>{info.tagline}</p>
                              <p className="text-[9px] text-[var(--color-ink-faint)] leading-snug mt-0.5">{info.desc}</p>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <KkachiTip>{buildUnseongDetail(natal.sibi_unseong)}</KkachiTip>
            <KkachiTip>{buildUnseongSummary(natal.sibi_unseong, name)}</KkachiTip>
          </div>
        </div>
      )}

      {/* 신살 */}
      {(natal.sibi_sinsal?.some(Boolean) || natal.sinsal.length > 0) && (
        <div className="slide-card">
          <div className="slide-card__header">
            <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">신살(神殺)</h3>
            <p className="text-xs text-[var(--color-ink-faint)] mt-1 leading-relaxed">
              사주 각 기둥에 배당되는 기운. 현대에는
              <strong className="text-[var(--color-ink-muted)]"> 개인의 독특한 역량과 특성</strong>으로 풀이합니다.
            </p>
          </div>
          <div className="divider" />
          <div className="slide-card__body space-y-4">

            {/* 십이신살 — 기둥별 */}
            {natal.sibi_sinsal?.some(Boolean) && (
              <div>
                <p className="text-[10px] font-semibold text-[var(--color-ink-muted)] mb-2">십이신살(十二神殺) — 일지 기준 기둥별 배당</p>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 2, 1, 0].map((origI) => {
                    const PILLAR_LABELS_SHORT = ["年柱", "月柱", "日柱", "時柱"];
                    const sinsalName = natal.sibi_sinsal[origI] || "";
                    return (
                      <div key={origI} className="rounded-xl border text-center px-2 py-3" style={{ borderColor: "var(--color-border-light)", backgroundColor: "var(--color-card)" }}>
                        <div className="text-[10px] text-[var(--color-ink-faint)] mb-1">{PILLAR_LABELS_SHORT[origI]}</div>
                        <div className="text-sm font-semibold text-[var(--color-ink)]">{sinsalName || "—"}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 특수신살 — 카드 */}
            {natal.sinsal.length > 0 && (() => {
              const myMap = natal.sinsal.reduce<Record<string, string[]>>((acc, s) => {
                if (!acc[s.sinsal_korean]) acc[s.sinsal_korean] = [];
                acc[s.sinsal_korean].push(s.branch);
                return acc;
              }, {});
              const mySet = new Set(Object.keys(myMap));
              const activeCombo = SINSAL_COMBOS.find((c) => c.needs.every((n) => mySet.has(n)));
              const hasBaekho = mySet.has("백호살");
              return (
                <>
                  {natal.sibi_sinsal?.some(Boolean) && (
                    <p className="text-[10px] font-semibold text-[var(--color-ink-muted)]">특수신살</p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {SINSAL_ORDER.filter((n) => !!myMap[n]).map((sinsalName) => {
                      const info = SINSAL_INFO[sinsalName];
                      return (
                        <div key={sinsalName} className="rounded-xl p-3 border overflow-hidden" style={{ backgroundColor: info.bg, borderColor: info.border }}>
                          <p className="font-heading text-sm font-bold text-[var(--color-ink)]">
                            {sinsalName}
                            <span className="text-[10px] font-normal text-[var(--color-ink-faint)] ml-1">{info.hanja}</span>
                          </p>
                          <p className="text-xs text-[var(--color-ink-faint)] leading-snug mt-1">{info.tagline} — {info.desc}</p>
                          <img
                            src={`/kkachi/sinsal_${sinsalName}.png`}
                            alt={sinsalName}
                            className="w-full rounded-lg object-cover mt-2"
                            onError={(e) => { (e.target as HTMLImageElement).src = "/kkachi/normal_kkachi_00.png"; }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {hasBaekho && (
                    <KkachiTip>
                      백호살은 무서운 게 아니에요! 에너지가 워낙 강해서 생기는 일들이니, 이 힘을 전문적인 업무나 강한 집중력이 필요한 곳에 쏟아보세요. 외과의사, 운동선수, 소방관처럼 강도 높은 환경에서 오히려 두각을 나타내는 기운이에요.
                    </KkachiTip>
                  )}
                  {activeCombo && <KkachiTip>{activeCombo.message}</KkachiTip>}
                  {!hasBaekho && !activeCombo && <KkachiTip>{buildSinsalNarrative(natal.sinsal, name)}</KkachiTip>}
                </>
              );
            })()}

          </div>
        </div>
      )}
    </div>
  );
}
