"use client";

import { useState, useEffect } from "react";
import type { NatalResult, SipsinInfo, SibiUnseongInfo, SinsalInfo } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";
import PillarDetail from "@/components/PillarDetail";
import SectionHeader from "@/components/SectionHeader";
import CollapsibleSectionHeader from "@/components/CollapsibleSectionHeader";
import KkachiTip from "@/components/KkachiTip";

const STEM_PROFILE: Record<string, { nickname: string; tagline: string; keywords: string[]; hint: string }> = {
  "甲": { nickname: "큰 나무",  tagline: "큰 나무 (大林木)",              keywords: ["도전", "리더십", "직진본능", "자존심"],   hint: "고집이 세 보일 수 있지만, 그 뚝심이 당신의 가장 큰 무기예요." },
  "乙": { nickname: "화초",     tagline: "화초 · 덩굴 (花草木)",          keywords: ["유연함", "친화력", "적응력", "눈치"],      hint: "부드럽게 감아 올라가는 덩굴처럼 관계와 환경을 내 편으로 만드는 능력이 있어요." },
  "丙": { nickname: "태양",     tagline: "태양 · 큰 불 (太陽火)",         keywords: ["열정", "존재감", "솔직함", "에너지"],     hint: "어딜 가도 존재감이 넘쳐요. 무대 위에 서면 더욱 빛나는 타입입니다." },
  "丁": { nickname: "촛불",     tagline: "촛불 · 등불 (燈燭火)",          keywords: ["섬세함", "집중력", "감수성", "예리함"],   hint: "겉으론 조용해 보여도 속에 깊은 열정이 있어요. 집중할 때의 몰입력이 대단합니다." },
  "戊": { nickname: "산",       tagline: "큰 산 · 성벽 (城牆土)",         keywords: ["포용력", "신뢰", "묵직함", "책임감"],     hint: "사람들이 본능적으로 기대고 싶어하는 타입이에요. 그 무게를 즐기세요." },
  "己": { nickname: "논밭",     tagline: "논밭 · 기름진 흙 (田園土)",     keywords: ["세심함", "배려", "꼼꼼함", "현실감각"],   hint: "디테일에 강하고 사람을 잘 챙겨요. 그 섬세한 감각이 큰 자산입니다." },
  "庚": { nickname: "검",       tagline: "큰 쇠 · 검 (劍戟金)",           keywords: ["결단력", "원칙", "추진력", "강직함"],     hint: "망설임 없는 결단력이 강점이에요. 때로는 부드러운 접근도 더 효과적일 수 있어요." },
  "辛": { nickname: "보석",     tagline: "보석 · 세공된 금속 (珠寶金)",   keywords: ["완벽주의", "심미안", "자존감", "날카로움"], hint: "스스로의 기준이 높은 편이에요. 그 높은 기준이 당신을 특별하게 만들어줘요." },
  "壬": { nickname: "바다",     tagline: "바다 · 강 (江河水)",            keywords: ["통찰력", "지략", "포용", "사유"],         hint: "큰 그림을 보는 전략적 사고가 뛰어나요. 흐름을 읽는 능력을 믿으세요." },
  "癸": { nickname: "빗물",     tagline: "비 · 이슬 (雨露水)",            keywords: ["직관", "감성", "배려", "내면의 힘"],      hint: "겉으로 드러나지 않는 깊은 감수성과 직관이 있어요. 혼자만의 시간이 에너지를 충전해줘요." },
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
  성장기: { label: "🌱 성장기(봄·새싹)", color: "#5B8C6A", bg: "#EEF4F0" },
  번영기: { label: "👑 번영기(여름·만개)", color: "#B8945A", bg: "#F5F0E7" },
  수렴기: { label: "🌙 수렴기(가을·낙엽)", color: "#4A7BA5", bg: "#ECF1F6" },
  태동기: { label: "🔄 태동기(겨울·씨앗)", color: "#7E7E8A", bg: "#F0F0F2" },
};

const UNSEONG_INFO: Record<string, { korean: string; phase: string; tagline: string; desc: string }> = {
  "長生": { korean: "장생", phase: "성장기", tagline: "새로 시작되는 기운",     desc: "새로운 시작, 주변의 도움과 사랑을 받는 기운" },
  "沐浴": { korean: "목욕", phase: "성장기", tagline: "들떠 있는 호기심",       desc: "호기심 왕성, 주목받고 싶어 하는 에너지" },
  "冠帶": { korean: "관대", phase: "성장기", tagline: "추진력이 폭발하는 단계", desc: "의욕이 앞서고 추진력이 폭발하는 시기" },
  "建祿": { korean: "건록", phase: "번영기", tagline: "스스로 자립하는 기운",   desc: "스스로의 힘으로 안정적인 기반을 닦는 탄탄한 기운" },
  "帝旺": { korean: "제왕", phase: "번영기", tagline: "에너지 절정",            desc: "에너지의 정점, 최고의 권위와 지배력을 발휘" },
  "衰":   { korean: "쇠",   phase: "번영기", tagline: "노련하게 조율하는 단계", desc: "힘은 지났지만 경험과 지혜로 여유롭게 조율" },
  "病":   { korean: "병",   phase: "수렴기", tagline: "감수성이 깊어지는 단계", desc: "활동력은 줄지만 감수성과 동정심이 깊어지는 단계" },
  "死":   { korean: "사",   phase: "수렴기", tagline: "고요한 멈춤",            desc: "겉의 움직임은 없으나 내면의 집중력이 극대화" },
  "墓":   { korean: "묘",   phase: "수렴기", tagline: "내공의 저장",            desc: "내실을 다지고 절약하며 미래를 준비하는 시기" },
  "絕":   { korean: "절",   phase: "태동기", tagline: "끊고 새로 시작하는 전환", desc: "과거 정리 후 새로운 반전을 꿈꾸는 드라마틱한 지점" },
  "胎":   { korean: "태",   phase: "태동기", tagline: "씨앗이 잉태되는 단계",   desc: "새 생명이 잉태된 상태, 무한한 가능성의 시작" },
  "養":   { korean: "양",   phase: "태동기", tagline: "보호받으며 자라는 단계", desc: "안전하게 보호받으며 세상 밖으로 나갈 준비" },
};

function buildSipsinStory(sipsin: SipsinInfo[], name: string): React.ReactNode {
  if (sipsin.length === 0) return null;

  const catCounts = SIPSIN_CATEGORIES.map((cat) => ({
    cat,
    count: sipsin.filter((s) => cat.members.includes(s.sipsin_name)).length,
  }));
  const sorted = [...catCounts].sort((a, b) => b.count - a.count);
  const strong = sorted.filter((c) => c.count >= 2);
  const missing = catCounts.filter((c) => c.count === 0);

  const prefix = name ? `${name}님 사주는 ` : "이 사주는 ";
  const firstKeyword = (k: string) => k.split(",")[0].trim();

  let core: React.ReactNode;
  if (strong.length >= 2) {
    core = (
      <>
        <strong className="text-[var(--color-ink)]">{strong.map((s) => s.cat.label).join("·")}</strong>이(가) 두드러지는 사주예요. {strong.map((s) => firstKeyword(s.cat.keyword)).join("과 ")}이 동시에 살아 있어 자기 페이스로 영역을 끌어가는 흐름입니다.
      </>
    );
  } else if (strong.length === 1) {
    const s = strong[0];
    core = (
      <>
        <strong className="text-[var(--color-ink)]">{s.cat.label}({s.cat.hanja})</strong>이 가장 두드러지는 사주예요. {firstKeyword(s.cat.keyword)} 영역에서 자기 색이 가장 잘 살아납니다.
      </>
    );
  } else {
    core = <>다섯 카테고리에 한 글자씩 골고루 들어 있는 균형형이에요. 어느 한쪽으로 치우치지 않고 다양한 영역을 두루 경험하는 흐름입니다.</>;
  }

  const missingPart = missing.length > 0 && missing.length < 5 ? (
    <> 단, <strong className="text-[var(--color-ink)]">{missing.map((m) => m.cat.label).join("·")}</strong> 자리는 비어 있어, {missing.map((m) => firstKeyword(m.cat.keyword)).join("·")} 영역에선 환경·사람의 도움을 활용하면 좋아요.</>
  ) : null;

  return (
    <span>{prefix}{core}{missingPart}</span>
  );
}

/* ── 십이운성 ── */
const STRONG_UNSEONG = new Set(["建祿", "帝旺", "冠帶", "長生"]);
const WEAK_UNSEONG = new Set(["病", "死", "絕"]);

const PILLAR_ERA: Record<string, { era: string; realm: string }> = {
  "년주": { era: "초년", realm: "조상·뿌리·환경" },
  "월주": { era: "청년기", realm: "사회·직장" },
  "일주": { era: "장년기", realm: "자기 본성·배우자" },
  "시주": { era: "말년", realm: "자녀·결실" },
};

const UNSEONG_VERB: Record<string, string> = {
  "長生": "갓 시작되는",
  "沐浴": "들떠 있는",
  "冠帶": "의욕이 폭발하는",
  "建祿": "단단히 자립하는",
  "帝旺": "절정을 찍는",
  "衰":   "노련하게 조율하는",
  "病":   "감수성이 깊어지는",
  "死":   "고요히 멈추는",
  "墓":   "내공을 쌓는",
  "絕":   "완전히 끊고 새로 시작하는",
  "胎":   "씨앗을 품는",
  "養":   "보호받으며 자라는",
};

function buildUnseongStory(sibiUnseong: SibiUnseongInfo[], name: string): React.ReactNode {
  const order = ["년주", "월주", "일주", "시주"];
  type Seg = { pillar: string; era: string; realm: string; kor: string; hanja: string; verb: string };
  const segments: Seg[] = [];
  for (const pillar of order) {
    const u = sibiUnseong.find((s) => s.pillar === pillar);
    if (!u) continue;
    const era = PILLAR_ERA[pillar];
    const info = UNSEONG_INFO[u.unseong_name];
    segments.push({
      pillar,
      era: era?.era ?? pillar,
      realm: era?.realm ?? "",
      kor: info?.korean ?? u.unseong_name,
      hanja: u.unseong_name,
      verb: UNSEONG_VERB[u.unseong_name] ?? "",
    });
  }
  if (segments.length === 0) return null;

  // 연속 같은 운성 묶기
  type Group = { eras: string[]; pillars: string[]; realms: string[]; kor: string; hanja: string; verb: string };
  const groups: Group[] = [];
  for (const seg of segments) {
    const last = groups[groups.length - 1];
    if (last && last.hanja === seg.hanja) {
      last.eras.push(seg.era);
      last.pillars.push(seg.pillar);
      last.realms.push(seg.realm);
    } else {
      groups.push({
        eras: [seg.era], pillars: [seg.pillar], realms: [seg.realm],
        kor: seg.kor, hanja: seg.hanja, verb: seg.verb,
      });
    }
  }

  const prefix = name ? `${name}님의 ` : "당신의 ";

  return (
    <span>
      {prefix}인생 흐름을 까치가 풀어볼게요.{" "}
      {groups.map((g, i) => {
        const isFirst = i === 0;
        const isLast = i === groups.length - 1 && groups.length > 1;
        const linker = isFirst ? "" : isLast ? " 그러다 " : " 이어서 ";
        const eraText = g.eras.join("·") + `(${g.pillars.join("·")})`;
        const realmText = [...new Set(g.realms.flatMap((r) => r.split("·")))].join("·");
        const groupedAdj = g.eras.length > 1 ? "는 모두" : "은";
        return (
          <span key={i}>
            {linker}<strong className="text-[var(--color-ink)]">{eraText}</strong>{groupedAdj} {g.kor}({g.hanja}) — <em className="not-italic" style={{ color: "var(--color-gold)" }}>{g.verb} 시기</em>예요. {realmText && <>이 시기엔 <strong className="text-[var(--color-ink)]">{realmText}</strong> 영역에서 그 기운이 가장 진하게 작동해요.</>}
          </span>
        );
      })}
    </span>
  );
}

function getEnergyPattern(sibiUnseong: SibiUnseongInfo[]) {
  const strong = sibiUnseong.filter((u) => STRONG_UNSEONG.has(u.unseong_name)).length;
  const weak = sibiUnseong.filter((u) => WEAK_UNSEONG.has(u.unseong_name)).length;
  const mid = sibiUnseong.length - strong - weak;

  if (strong >= 3) return {
    image: "/kkachi/sibi_unseong/strong.png", title: "활동력 충만형", strong, mid, weak,
    desc: "활동력이 끊이지 않는 사주예요. 타고난 실력을 마음껏 발휘할 수 있고, 큰일에도 흔들리지 않는 추진력이 있는 타입입니다.",
  };
  if (weak >= 3) return {
    image: "/kkachi/sibi_unseong/deep.png", title: "깊이 승부형", strong, mid, weak,
    desc: "에너지를 안으로 모으는 인생이에요. 활동보다 사색·전문성·감수성으로 승부하는, 깊이 있는 타입이에요.",
  };
  if (strong > weak) return {
    image: "/kkachi/sibi_unseong/active.png", title: "활동력 우세형", strong, mid, weak,
    desc: "강한 시기가 더 많은 안정적인 흐름이에요. 꾸준히 성장하면서 성과를 쌓을 수 있는 타입입니다.",
  };
  if (weak > strong) return {
    image: "/kkachi/sibi_unseong/latebloomer.png", title: "후반에 빛나는 늦깎이형", strong, mid, weak,
    desc: "약한 시기가 깊이로 변하는 인생이에요. 의지로 밀어붙이기보단 환경·사람을 잘 활용해 후반전을 진짜로 만드는 타입이에요.",
  };
  return {
    image: "/kkachi/sibi_unseong/wave.png", title: "굴곡 있는 흐름형", strong, mid, weak,
    desc: "강함과 약함이 교차하며, 시기에 따라 컨디션 차이가 큰 타입이에요. 자기 사이클을 잘 읽으면 강할 때 밀어붙이고 약할 때 충전하기 좋아요.",
  };
}

function EnergyPatternCard({ sibiUnseong }: { sibiUnseong: SibiUnseongInfo[] }) {
  const { image, title, strong, mid, weak } = getEnergyPattern(sibiUnseong);
  const stats: { label: string; hanja: string; count: number }[] = [
    { label: "강", hanja: "强", count: strong },
    { label: "평", hanja: "平", count: mid },
    { label: "약", hanja: "弱", count: weak },
  ];

  return (
    <div className="rounded-xl border border-[var(--color-border-light)] p-4 space-y-2"
      style={{ backgroundColor: "var(--color-card)" }}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-[var(--color-ink-muted)]">인생 에너지 패턴</p>
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-ink-muted)]">
          {stats.map(({ label, hanja, count }, i) => (
            <span key={label} className="flex items-center gap-0.5">
              {i > 0 && <span className="text-[var(--color-ink-faint)]">·</span>}
              <span>{label}({hanja})</span>
              <strong className="text-[var(--color-ink)]">{count}</strong>
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <img src={image} alt={title}
          className="w-2/3 aspect-[3/2] rounded-2xl object-cover"
          style={{ backgroundColor: "var(--color-ivory)" }} />
        <p className="text-base font-bold text-[var(--color-ink)] text-center">{title}</p>
      </div>
    </div>
  );
}

function LifeEnergyTable({ sibiUnseong, pillars }: { sibiUnseong: SibiUnseongInfo[]; pillars: string[] }) {
  const PILLAR_ORDER: { key: string; label: string; idx: number }[] = [
    { key: "시주", label: "시주(時柱)", idx: 3 },
    { key: "일주", label: "일주(日柱)", idx: 2 },
    { key: "월주", label: "월주(月柱)", idx: 1 },
    { key: "년주", label: "년주(年柱)", idx: 0 },
  ];

  const cols = PILLAR_ORDER.map(({ key, label, idx }) => {
    const u = sibiUnseong.find((s) => s.pillar === key);
    const info = u ? UNSEONG_INFO[u.unseong_name] : null;
    const phase = info ? UNSEONG_PHASE[info.phase] : null;
    const pillar = pillars[idx] ?? "";
    const stem = pillar[0] ?? "";
    const branch = pillar[1] ?? "";
    return {
      key, label, isDay: key === "일주", u, info, phase,
      stem, branch,
      stemKor: STEM_KOR[stem] ?? "",
      branchKor: BRANCH_KOR[branch] ?? "",
    };
  });

  return (
    <div className="rounded-xl border border-[var(--color-border-light)] overflow-hidden">
      <table className="w-full text-center border-collapse" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "72px" }} />
          <col />
          <col />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr style={{ backgroundColor: "var(--color-ivory)" }}>
            <th className="text-[10px] font-medium text-[var(--color-ink-faint)] py-1.5 px-2"></th>
            {cols.map(({ key, label, isDay }) => (
              <th key={key} className="text-[10px] font-semibold py-1.5 px-2"
                style={{
                  color: isDay ? "var(--color-gold)" : "var(--color-ink-muted)",
                  backgroundColor: isDay ? "var(--color-gold-faint)" : undefined,
                }}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-[var(--color-border-light)]">
            <td className="text-[10px] py-1.5 px-2 whitespace-nowrap text-left text-[var(--color-ink-faint)]">천간(天干)</td>
            {cols.map(({ key, stem, stemKor }) => (
              <td key={key} className="py-1.5 px-2">
                <span className="font-heading text-sm font-bold leading-tight text-[var(--color-ink)]">
                  {stem ? `${stemKor}(${stem})` : "—"}
                </span>
              </td>
            ))}
          </tr>
          <tr className="border-t border-[var(--color-border-light)]">
            <td className="text-[10px] py-1.5 px-2 whitespace-nowrap text-left text-[var(--color-ink-faint)]">지지(地支)</td>
            {cols.map(({ key, branch, branchKor }) => (
              <td key={key} className="py-1.5 px-2">
                <span className="font-heading text-sm font-bold leading-tight text-[var(--color-ink)]">
                  {branch ? `${branchKor}(${branch})` : "—"}
                </span>
              </td>
            ))}
          </tr>
          <tr className="border-t border-[var(--color-border-light)]">
            <td className="text-[10px] py-2 px-2 whitespace-nowrap text-left text-[var(--color-ink-faint)]">운성(運星)</td>
            {cols.map(({ key, u, info, phase }) => (
              <td key={key} className="py-2 px-2">
                {u ? (
                  <div className="font-heading text-sm font-bold leading-tight"
                    style={{ color: phase?.color ?? "var(--color-ink)" }}>
                    {info?.korean ?? u.unseong_name}({u.unseong_name})
                  </div>
                ) : <span className="text-xs text-[var(--color-ink-faint)]">—</span>}
              </td>
            ))}
          </tr>
          <tr className="border-t border-[var(--color-border-light)]">
            <td className="text-[10px] py-2 px-2 whitespace-nowrap text-left text-[var(--color-ink-faint)] align-top">특징</td>
            {cols.map(({ key, u, info, phase }) => (
              <td key={key} className="py-2 px-2 align-top">
                {u && info ? (
                  <div className="space-y-1">
                    <div className="text-[10px] font-medium leading-snug" style={{ color: phase?.color ?? "var(--color-ink-muted)" }}>
                      {info.tagline}
                    </div>
                    <div className="text-[9px] text-[var(--color-ink-faint)] leading-snug">
                      {info.desc}
                    </div>
                  </div>
                ) : <span className="text-xs text-[var(--color-ink-faint)]">—</span>}
              </td>
            ))}
          </tr>
          <tr className="border-t border-[var(--color-border-light)]">
            <td className="text-[10px] py-2 px-2 whitespace-nowrap text-left text-[var(--color-ink-faint)]">에너지</td>
            {cols.map(({ key, u }) => {
              if (!u) return <td key={key} className="py-2 px-2"><span className="text-xs text-[var(--color-ink-faint)]">—</span></td>;
              const isStrong = STRONG_UNSEONG.has(u.unseong_name);
              const isWeak = WEAK_UNSEONG.has(u.unseong_name);
              const label = isStrong ? "강(强)" : isWeak ? "약(弱)" : "평(平)";
              return (
                <td key={key} className="py-2 px-2">
                  <span className="text-xs font-bold text-[var(--color-ink)]">{label}</span>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ── 십이신살(十二神殺) ── */
function buildSibiSinsalStory(sibiSinsal: string[], name: string): React.ReactNode {
  const order: { idx: number; label: string; era: string; realm: string }[] = [
    { idx: 0, label: "년주", era: "초년",   realm: "조상·뿌리·환경" },
    { idx: 1, label: "월주", era: "청년기", realm: "사회·직장" },
    { idx: 2, label: "일주", era: "장년기", realm: "자기 본성·배우자" },
    { idx: 3, label: "시주", era: "말년",   realm: "자녀·결실" },
  ];

  type Seg = { label: string; era: string; realm: string; sName: string; hanja: string; meaning: string };
  const segments: Seg[] = [];
  for (const { idx, label, era, realm } of order) {
    const sName = sibiSinsal[idx];
    if (!sName) continue;
    const info = SIBI_SINSAL_INFO[sName];
    segments.push({ label, era, realm, sName, hanja: info?.hanja ?? "", meaning: info?.meaning ?? "" });
  }
  if (segments.length === 0) return null;

  type Group = { eras: string[]; labels: string[]; realms: string[]; sName: string; hanja: string; meaning: string };
  const groups: Group[] = [];
  for (const seg of segments) {
    const last = groups[groups.length - 1];
    if (last && last.sName === seg.sName) {
      last.eras.push(seg.era); last.labels.push(seg.label); last.realms.push(seg.realm);
    } else {
      groups.push({
        eras: [seg.era], labels: [seg.label], realms: [seg.realm],
        sName: seg.sName, hanja: seg.hanja, meaning: seg.meaning,
      });
    }
  }

  const prefix = name ? `${name}님의 ` : "당신의 ";

  return (
    <span>
      {prefix}십이신살 흐름은 이래요.{" "}
      {groups.map((g, i) => {
        const isFirst = i === 0;
        const isLast = i === groups.length - 1 && groups.length > 1;
        const linker = isFirst ? "" : isLast ? " 그러다 " : " 이어서 ";
        const eraText = g.eras.join("·") + `(${g.labels.join("·")})`;
        const realmText = [...new Set(g.realms.flatMap((r) => r.split("·")))].join("·");
        const groupedAdj = g.eras.length > 1 ? "는 둘 다" : "은";
        return (
          <span key={i}>
            {linker}<strong className="text-[var(--color-ink)]">{eraText}</strong>{groupedAdj} {g.sName}{g.hanja && `(${g.hanja})`} — <em className="not-italic" style={{ color: "var(--color-gold)" }}>{g.meaning}</em>의 기운이에요. {realmText && <>이 시기 <strong className="text-[var(--color-ink)]">{realmText}</strong> 영역에서 그 결이 드러납니다.</>}
          </span>
        );
      })}
    </span>
  );
}

const SIBI_SINSAL_INFO: Record<string, { hanja: string; meaning: string }> = {
  "겁살":   { hanja: "劫殺",   meaning: "빼앗김·사고·도난 주의" },
  "재살":   { hanja: "災殺",   meaning: "재앙·갈등의 기운" },
  "천살":   { hanja: "天殺",   meaning: "하늘이 내리는 변고" },
  "지살":   { hanja: "地殺",   meaning: "이동·변동·출장" },
  "년살":   { hanja: "年殺",   meaning: "매력·인기·도화" },
  "월살":   { hanja: "月殺",   meaning: "어두운 그림자·우울" },
  "망신살": { hanja: "亡身殺", meaning: "체면 손상·구설" },
  "장성살": { hanja: "將星殺", meaning: "리더십·권위·결단력" },
  "반안살": { hanja: "攀鞍殺", meaning: "출세·승진·명예" },
  "역마살": { hanja: "驛馬殺", meaning: "이동·변화·해외" },
  "육해살": { hanja: "六害殺", meaning: "방해·갈등·장애물" },
  "화개살": { hanja: "華蓋殺", meaning: "예술·학문·고독" },
};

/* ── 신살 ── */
const SINSAL_INFO: Record<string, { hanja: string; tagline: string; desc: string; color: string; bg: string; border: string }> = {
  "도화살":   { hanja: "桃花殺",   tagline: "복숭아꽃의 향기",      color: "#C06B8A", bg: "#F7EFF3", border: "#E0B5C8", desc: "가만히 있어도 시선이 모이는 강력한 매력과 스타성. 퍼스널 브랜딩·마케팅·예술 분야에서 타고난 강점을 발휘합니다." },
  "역마살":   { hanja: "驛馬殺",   tagline: "지치지 않는 엔진",     color: "#5B8C6A", bg: "#EEF4F0", border: "#A8C9B5", desc: "한곳에 머물기보다 끊임없이 움직이고 새 환경을 개척할 때 운이 풀립니다. 해외·여행·유통 분야에서 빛납니다." },
  "화개살":   { hanja: "華蓋殺",   tagline: "화려한 덮개",          color: "#7B68A0", bg: "#F2F0F7", border: "#C5BCDB", desc: "예술적 감수성과 종교·철학적 깊이가 있는 에너지. 고독해 보이지만 창의성과 전문 지식이 깊은 학자·아티스트의 기운." },
  "천을귀인": { hanja: "天乙貴人", tagline: "최고의 조력자",        color: "#B8945A", bg: "#F5F0E7", border: "#D9C49A", desc: "위기의 순간 귀인이 나타나거나 큰 화를 면하게 해주는 가장 복된 기운. 사람 복이 많고 고비마다 도움의 손길이 찾아옵니다." },
  "문창귀인": { hanja: "文昌貴人", tagline: "문서와 학문의 별",     color: "#4A7BA5", bg: "#ECF1F6", border: "#9BB8D0", desc: "시험·자격증·학업 운이 강하고 문서 처리 능력이 뛰어납니다. 지식으로 인정받고 전문성을 쌓아나가는 기운." },
  "장성살":   { hanja: "將星殺",   tagline: "대장군의 기개",        color: "#8B6A3E", bg: "#F5EFE5", border: "#C9A96E", desc: "대중을 압도하는 카리스마와 결단력. 리더십이 강하고 큰일을 도모할 때 발휘되는 강력한 에너지." },
  "백호살":   { hanja: "白虎殺",   tagline: "백호의 폭발적 집중력", color: "#C75B52", bg: "#F7EDEC", border: "#E0A8A3", desc: "에너지가 워낙 강해서 사고나 급변을 주의해야 하지만, 전문직에서 폭발적인 집중력으로 남들이 못 하는 일을 해냅니다." },
  "천덕귀인": { hanja: "天德貴人", tagline: "하늘이 덮어주는 복",   color: "#C9A554", bg: "#F7F2E5", border: "#DDC785", desc: "큰 위기에서도 다치지 않고 빠져나가는 보호의 기운. 길게 보면 복이 깃들어 자연스럽게 잘 풀리는 사주예요." },
  "월덕귀인": { hanja: "月德貴人", tagline: "조용히 흐르는 평안",   color: "#6B9A8B", bg: "#EFF4F2", border: "#B5CFC5", desc: "갈등을 피하고 평화롭게 풀리는 운. 충돌보다 조율로 일이 풀리는, 인간관계가 부드러운 타입이에요." },
};

const SINSAL_ORDER = ["도화살", "역마살", "화개살", "천을귀인", "문창귀인", "장성살", "백호살", "천덕귀인", "월덕귀인"];

function buildSinsalNarrative(sinsal: SinsalInfo[], name: string): string {
  const p = name ? `${name}님` : "이 사주";
  if (sinsal.length === 0) return "";
  const names = [...new Set(sinsal.map((s) => s.sinsal_korean))].join(", ");
  return `${p} 사주에 ${names}이 있어요. 이 특별한 기운을 잘 활용하면 타고난 캐릭터성을 살릴 수 있어요.`;
}

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

const ROLE_HANJA: Record<string, string> = {
  "여기": "餘氣",
  "중기": "中氣",
  "본기": "本氣",
};

const BRANCH_KOR: Record<string, string> = {
  子:"자", 丑:"축", 寅:"인", 卯:"묘", 辰:"진", 巳:"사",
  午:"오", 未:"미", 申:"신", 酉:"유", 戌:"술", 亥:"해",
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

function OhaengSourceBreakdown({ pillars, pillarElements = [], stats }: {
  pillars: string[];
  pillarElements?: { stem_element: string; branch_element: string }[];
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

const SIPSIN_CATEGORIES: { label: string; hanja: string; keyword: string; members: string[]; color: string; bg: string; description: string }[] = [
  { label: "자아", hanja: "自我", keyword: "주체성, 경쟁력", members: ["比肩", "劫財"], color: "#B8945A", bg: "#F5F0E7",
    description: "나 자신·형제·동료·경쟁자처럼 나와 같은 결의 기운이에요. 강하면 자기 주관과 추진력이 살아나고, 약하면 주변 페이스에 끌려가기 쉬워 동료의 도움이 중요해집니다." },
  { label: "출력", hanja: "出力", keyword: "표현력, 창의성", members: ["食神", "傷官"], color: "#5B8C6A", bg: "#EEF4F0",
    description: "표현·창작·말·자녀처럼 내가 밖으로 만들어내는 영역이에요. 강하면 톡톡 튀는 표현력과 창의성이 살아나고, 약하면 속마음을 드러내지 못해 답답함이 쌓일 수 있어요." },
  { label: "재물", hanja: "財物", keyword: "경제 활동",     members: ["偏財", "正財"], color: "#4A7BA5", bg: "#ECF1F6",
    description: "돈·자산·소유처럼 내가 다스리는 자원이며, 남자에게는 배우자도 이 영역에 속해요. 강하면 경제 감각과 현실 추진력이 살아나고, 약하면 환경의 도움을 받는 흐름이 됩니다." },
  { label: "권위", hanja: "權威", keyword: "책임감, 명예",   members: ["偏官", "正官"], color: "#7B68A0", bg: "#F2F0F7",
    description: "직장·상사·법·규율처럼 나를 묶고 책임을 지우는 영역이며, 여자에게는 배우자도 여기 속해요. 강하면 책임감과 명예욕·리더십이 커지고, 약하면 조직에서 자기 자리를 만드는 데 시간이 걸리는 편입니다." },
  { label: "입력", hanja: "入力", keyword: "수용성, 학문",   members: ["偏印", "正印"], color: "#B85A8A", bg: "#F7EBEF",
    description: "어머니·학문·도움·지식처럼 나를 길러주는 영역이에요. 강하면 배움과 인덕이 좋고, 약하면 스스로 길을 찾는 자수성가형이 됩니다." },
];

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
  const [sipsinOpen, setSipsinOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("kkachi_concept_saju") === "open") setSajuOpen(true);
    if (localStorage.getItem("kkachi_concept_oheng") === "open") setOhengOpen(true);
    if (localStorage.getItem("kkachi_concept_sipsin") === "open") setSipsinOpen(true);
  }, []);

  const toggleSaju = () => { const next = !sajuOpen; setSajuOpen(next); localStorage.setItem("kkachi_concept_saju", next ? "open" : "closed"); };
  const toggleOheng = () => { const next = !ohengOpen; setOhengOpen(next); localStorage.setItem("kkachi_concept_oheng", next ? "open" : "closed"); };
  const toggleSipsin = () => { const next = !sipsinOpen; setSipsinOpen(next); localStorage.setItem("kkachi_concept_sipsin", next ? "open" : "closed"); };

  return (
    <div className="space-y-4">
      {/* 사주팔자 + 일간 정체성 */}
      <div className="slide-card">
        <div className="slide-card__header" style={sajuOpen ? { paddingBottom: 6 } : undefined}>
          <div className="flex items-center gap-2">
            <SectionHeader title="사주팔자(四柱八字)" noMargin />
            <button type="button" onClick={toggleSaju} className="text-[10px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink-muted)] transition-colors flex items-center gap-0.5">
              설명 <span>{sajuOpen ? "▲" : "▼"}</span>
            </button>
          </div>
          {sajuOpen && (
            <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed mt-2">
              태어난 <strong className="text-[var(--color-ink)]">연·월·일·시</strong>를 각각 하늘(천간)과 땅(지지) 두 글자로 표현한 것이 <strong className="text-[var(--color-ink)]">사주(四柱)</strong>, 그 여덟 글자를 <strong className="text-[var(--color-ink)]">팔자(八字)</strong>예요. 그 중 태어난 날의 천간(日干)이 <strong className="text-[var(--color-ink)]">나 자신</strong>을 상징하며, 사주 전체가 이 일간을 중심으로 풀이됩니다.
            </p>
          )}
        </div>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          <KkachiTip>
            사주의 4기둥 8글자가 펼쳐지는 큰 지도예요. 위쪽 천간(天干)은 마음·뜻을, 아래쪽 지지(地支)는 환경·시간을 나타내요. 그 중 일주의 천간(日干)이 바로 나 자신입니다.
          </KkachiTip>

          <PillarDetail
            pillars={natal.pillars}
            dayStem={natal.day_stem}
            basic
          />

          {/* 일간(日干) 정체성 */}
          {(() => {
            const stemProfile = STEM_PROFILE[natal.day_stem] ?? STEM_PROFILE["甲"];
            const stemKor = STEM_KOR[natal.day_stem] ?? "";
            return (
              <div className="rounded-xl p-4 space-y-3 border border-[var(--color-border-light)]"
                style={{ backgroundColor: "var(--color-card)" }}>
                <p className="text-xs font-semibold text-[var(--color-ink-muted)] text-center">
                  일간(日干) 심상(心象)
                </p>
                <img
                  src={`/kkachi/sipgan/십간_${stemKor}.png`}
                  alt=""
                  className="w-4/5 mx-auto block aspect-[3/2] rounded-2xl object-cover"
                  style={{ backgroundColor: "var(--color-card)" }}
                  onError={(e) => { (e.target as HTMLImageElement).src = "/kkachi/normal_kkachi_00.png"; }}
                />
                <div className="flex flex-col items-center gap-2 text-center">
                  <p className="font-heading font-bold leading-snug text-[var(--color-ink)]">
                    <span className="text-3xl mr-1" style={{ color: meInfo.color }}>
                      {stemKor || natal.day_stem}({natal.day_stem})
                    </span>
                    <span className="text-lg">- {stemProfile.tagline}</span>
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {stemProfile.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
                        style={{ color: meInfo.color, borderColor: meInfo.borderColor, backgroundColor: meInfo.bgColor }}
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          <KkachiTip>{STEM_PROFILE[natal.day_stem]?.hint ?? ""}</KkachiTip>
        </div>
      </div>

      {/* 십신 */}
      {natal.sipsin.length > 0 && (
        <div className="slide-card">
          <div className="slide-card__header">
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">십신(十神)</h3>
              <button type="button" onClick={toggleSipsin} className="text-[10px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink-muted)] transition-colors flex items-center gap-0.5">
                설명 <span>{sipsinOpen ? "▲" : "▼"}</span>
              </button>
            </div>
            {sipsinOpen && (
              <div className="text-xs text-[var(--color-ink-muted)] leading-relaxed mt-2 space-y-2">
                <p>
                  {(() => {
                    const dayKor = STEM_KOR[natal.day_stem] ?? natal.day_stem;
                    const last = dayKor[dayKor.length - 1].charCodeAt(0);
                    const hasJongseong = last >= 0xAC00 && last <= 0xD7A3 && (last - 0xAC00) % 28 !== 0;
                    return (
                      <>
                        나를 뜻하는 일간(日干)의 <strong className="text-[var(--color-ink)]">{dayKor}({natal.day_stem})</strong>{hasJongseong ? "과" : "와"} 나머지 7글자가 어떤 관계인지 10가지로 분류한 체계예요. 재산·권위·관계를 대하는 방식 등 <strong className="text-[var(--color-ink)]">나만의 사회적 패턴</strong>을 보여줍니다.
                      </>
                    );
                  })()}
                </p>
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-[var(--color-ink-muted)]">사회적 관계 오분류</p>
                  <div className="space-y-2">
                    {SIPSIN_CATEGORIES.map((cat) => (
                      <div key={cat.label} className="rounded-md p-2.5"
                        style={{ backgroundColor: cat.bg, border: `1px solid ${cat.color}40` }}>
                        <div className="text-xs font-bold leading-tight mb-1" style={{ color: cat.color }}>
                          {cat.label}({cat.hanja})
                        </div>
                        <p className="text-[11px] text-[var(--color-ink-muted)] leading-relaxed">
                          {cat.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="divider" />
          <div className="slide-card__body">
            {(() => {
              const grouped = natal.sipsin.reduce<Record<string, { sipsin_name: string; chars: string[]; element: string; count: number }>>(
                (acc, s) => {
                  if (!acc[s.sipsin_name]) acc[s.sipsin_name] = { sipsin_name: s.sipsin_name, chars: [], element: s.element, count: 0 };
                  acc[s.sipsin_name].chars.push(s.char);
                  acc[s.sipsin_name].count++;
                  return acc;
                }, {}
              );
              return (
                <div className="mb-4">
                  {(() => {
                    const ordered: { sipsinName: string; cat: typeof SIPSIN_CATEGORIES[number] }[] = [];
                    for (const cat of SIPSIN_CATEGORIES) {
                      for (const m of cat.members) {
                        if (grouped[m]) ordered.push({ sipsinName: m, cat });
                      }
                    }
                    return (
                      <div className="grid grid-cols-2 gap-2">
                        {ordered.map(({ sipsinName, cat }) => {
                          const group = grouped[sipsinName];
                          const info = SIPSIN_INFO[sipsinName];
                          return (
                            <div key={sipsinName} className="rounded-lg overflow-hidden flex flex-col"
                              style={{ backgroundColor: cat.bg, border: `1.5px solid ${cat.color}40` }}>
                              <img
                                src={`/kkachi/sipsin/sipsin_${info?.korean ?? sipsinName}.png`}
                                alt={info?.korean ?? sipsinName}
                                className="w-full object-cover"
                                style={{ height: 160 }}
                                onError={(e) => { (e.target as HTMLImageElement).src = "/kkachi/normal_kkachi_00.png"; }}
                              />
                              <div className="p-2.5 flex-1">
                                <div className="text-[9px] font-semibold mb-1" style={{ color: cat.color }}>
                                  {cat.label}({cat.hanja}) - {cat.keyword}
                                </div>
                                <div className="flex items-start justify-between gap-1 mb-1">
                                  <p className="font-heading text-sm font-bold leading-snug text-[var(--color-ink)]">
                                    {info?.korean ?? sipsinName}({sipsinName})
                                    {info?.tagline && <span className="ml-1">— {info.tagline}</span>}
                                  </p>
                                  {group.count > 1 && (
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: cat.color + "20", color: cat.color, border: `1px solid ${cat.color}60` }}>
                                      ×{group.count}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-[var(--color-ink-faint)] leading-snug">{info?.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              );
            })()}
            <KkachiTip>{buildSipsinStory(natal.sipsin, name)}</KkachiTip>
          </div>
        </div>
      )}

      {/* 지장간 */}
      {natal.jizan_gan?.some((jg) => jg.length > 0) && (
        <div className="slide-card">
          <CollapsibleSectionHeader title="지장간(地藏干)">
            사주의 아래 글자(지지)는 한 달짜리 시간이에요. 그 안에서 여러 천간이 시간대별로 돌아가며 작동하는 게 지장간(地藏干, 땅에 감춰진 천간)이에요. 겉엔 잘 안 보여도 결정적인 순간 작동하는 <strong className="text-[var(--color-ink)]">잠재된 기운과 속마음</strong>을 보여줍니다. 본기·중기·여기 3단계로 비중이 다르며, 일지(日支) 본기는 <strong className="text-[var(--color-ink)]">자신의 진짜 욕구</strong>를 나타냅니다.
          </CollapsibleSectionHeader>
          <div className="divider" />
          <div className="slide-card__body space-y-4">
            {(() => {
              const heavenlyStems = natal.pillars.map((p) => p[0]);
              const dayJg = natal.jizan_gan[2] ?? [];
              const bonki = dayJg[dayJg.length - 1];
              return (
                <>
                  {/* 기둥별 지장간 — 테이블 매트릭스 */}
                  <div>
                    <div className="rounded-xl border border-[var(--color-border-light)] overflow-hidden">
                      <table className="w-full text-center border-collapse" style={{ tableLayout: "fixed" }}>
                        <colgroup>
                          <col style={{ width: "72px" }} />
                          <col />
                          <col />
                          <col />
                          <col />
                        </colgroup>
                        <thead>
                          <tr style={{ backgroundColor: "var(--color-ivory)" }}>
                            <th className="text-[10px] font-medium text-[var(--color-ink-faint)] py-1.5 px-2"></th>
                            {[3, 2, 1, 0].map((origI) => {
                              const PILLAR_LABELS_SHORT = ["년주(年柱)", "월주(月柱)", "일주(日柱)", "시주(時柱)"];
                              const isDayPillar = origI === 2;
                              return (
                                <th key={origI} className="text-[10px] font-semibold py-1.5 px-2"
                                  style={{
                                    color: isDayPillar ? "var(--color-gold)" : "var(--color-ink-muted)",
                                    backgroundColor: isDayPillar ? "var(--color-gold-faint)" : undefined,
                                  }}>
                                  {PILLAR_LABELS_SHORT[origI]}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {(["여기", "중기", "본기"] as const).map((role) => (
                            <tr key={role} className="border-t border-[var(--color-border-light)]">
                              <td className="text-[10px] py-2 px-2 whitespace-nowrap text-left"
                                style={role === "본기"
                                  ? { color: "var(--color-gold)", fontWeight: 700 }
                                  : { color: "var(--color-ink-faint)" }}>
                                {role}({ROLE_HANJA[role]})
                              </td>
                              {[3, 2, 1, 0].map((origI) => {
                                const item = natal.jizan_gan[origI]?.find((it) => it.role === role);
                                const isDayPillar = origI === 2;
                                const isExposed = !!item && heavenlyStems.includes(item.stem);
                                const isBonki = role === "본기";
                                return (
                                  <td key={origI} className="py-2 px-2"
                                    style={{ backgroundColor: isDayPillar ? "var(--color-gold-faint)" : undefined }}>
                                    {item ? (
                                      <div className="space-y-0.5">
                                        <div className={`font-heading leading-tight ${isBonki ? "text-base font-bold" : "text-xs"}`}
                                          style={{ color: isExposed ? "var(--color-gold)" : (isBonki ? "var(--color-ink)" : "var(--color-ink-muted)") }}>
                                          {item.stem}
                                          {isExposed && (
                                            <span className="inline-block rounded-full align-top ml-0.5"
                                              style={{ width: 3, height: 3, backgroundColor: "currentColor" }} />
                                          )}
                                        </div>
                                        <div className="text-[9px] text-[var(--color-ink-faint)] leading-tight">
                                          {SIPSIN_INFO[item.sipsin_name]?.korean ?? item.sipsin_name} · {item.weight}%
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-[var(--color-ink-faint)]">—</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-[var(--color-ink-faint)] mt-1.5 leading-relaxed">
                      <span className="inline-block rounded-full align-middle"
                        style={{ width: 4, height: 4, backgroundColor: "var(--color-gold)" }} /> 표시는 천간(天干)에 같은 글자가 드러난 투출(透干)
                    </p>
                  </div>

                  {/* 일지 본기 — 진짜 본심 */}
                  {bonki && (() => {
                    const info = SIPSIN_INFO[bonki.sipsin_name];
                    const kor = info?.korean ?? bonki.sipsin_name;
                    const stemKor = STEM_KOR[bonki.stem] ?? bonki.stem;
                    const exposed = heavenlyStems.includes(bonki.stem);
                    return (
                      <div className="rounded-xl p-4 space-y-3"
                        style={{ border: "1.5px solid var(--color-gold-light)", backgroundColor: "var(--color-gold-faint)" }}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">💭</span>
                          <span className="text-[11px] font-semibold text-[var(--color-gold)]">일지(日支) 본기 — 진짜 본심</span>
                        </div>
                        <div className="flex items-center gap-3.5">
                          <div className="relative flex flex-col items-center justify-center w-16 h-16 rounded-xl flex-shrink-0"
                            style={{ backgroundColor: "var(--color-card)", border: "1.5px solid var(--color-gold-light)" }}>
                            <span className="font-heading text-2xl font-bold text-[var(--color-ink)] leading-none">{bonki.stem}</span>
                            <span className="text-[10px] text-[var(--color-ink-faint)] mt-0.5">{stemKor}</span>
                            {exposed && (
                              <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ backgroundColor: "var(--color-gold)", color: "var(--color-ivory)" }}>
                                透
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <p className="text-sm font-bold text-[var(--color-ink)]">
                              {kor}<span className="text-[11px] font-normal text-[var(--color-ink-faint)] ml-1">({bonki.sipsin_name})</span>
                            </p>
                            {info && (
                              <>
                                <p className="text-xs font-medium text-[var(--color-gold)]">{info.tagline}</p>
                                <p className="text-[11px] text-[var(--color-ink-muted)] leading-snug">{info.desc}</p>
                              </>
                            )}
                          </div>
                        </div>
                        <KkachiTip>
                          {exposed
                            ? `천간(天干)에도 ${bonki.stem}이 투출(透出)되어 있어요. 본심이 자연스럽게 겉으로 표현되는, 속과 겉이 일치하는 솔직한 타입입니다.`
                            : `천간에는 드러나지 않은 깊은 욕구예요. 평소엔 잘 보이지 않지만, 결정의 순간 강하게 작용하는 진짜 본심입니다.`}
                        </KkachiTip>
                      </div>
                    );
                  })()}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* 공망 */}
      {natal.gongmang?.some(Boolean) && (
        <div className="slide-card">
          <CollapsibleSectionHeader title="공망(空亡)">
            60갑자(六十甲子) 순(旬)에서 짝이 없는 지지를 말해요. 해당 기둥의 기운이 비어 있어 약해지지만, <strong className="text-[var(--color-ink)]">집착을 내려놓을수록 오히려 잘 풀리는 기운</strong>으로 풀이합니다.
            현대 명리에서는 공망이 있는 영역에서는 무리한 욕심보다 <strong className="text-[var(--color-ink)]">담담한 태도</strong>가 좋은 결과를 만듭니다.
          </CollapsibleSectionHeader>
          <div className="divider" />
          <div className="slide-card__body space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {[3, 2, 1, 0].map((origI) => {
                const PILLAR_LABELS_SHORT = ["년주(年柱)", "월주(月柱)", "일주(日柱)", "시주(時柱)"];
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

      {/* 십이운성 */}
      {natal.sibi_unseong.length > 0 && (
        <div className="slide-card">
          <CollapsibleSectionHeader title="십이운성(十二運星)">
            인생의 <strong className="text-[var(--color-ink)]">생로병사 12단계 사이클</strong>이에요. 태어나(長生) → 절정(帝旺) → 쇠퇴 → 잠들었다(墓) → 다시 씨앗으로 돌아가는(胎) 흐름이죠.
            사주 4기둥(년·월·일·시)이 각각 어떤 단계인지 보면, <strong className="text-[var(--color-ink)]">인생 시기별 컨디션과 에너지 흐름</strong>이 한눈에 보입니다.
          </CollapsibleSectionHeader>
          <div className="divider" />
          <div className="slide-card__body space-y-4">
            {/* 기둥별 운성 표 */}
            <LifeEnergyTable sibiUnseong={natal.sibi_unseong} pillars={natal.pillars} />
            <KkachiTip>{buildUnseongStory(natal.sibi_unseong, name)}</KkachiTip>
            <EnergyPatternCard sibiUnseong={natal.sibi_unseong} />
            <KkachiTip>{getEnergyPattern(natal.sibi_unseong).desc}</KkachiTip>
          </div>
        </div>
      )}

      {/* 신살 */}
      {(natal.sibi_sinsal?.some(Boolean) || natal.sinsal.length > 0) && (
        <div className="slide-card">
          <CollapsibleSectionHeader title="신살(神殺)">
            옛날엔 길흉을 가르는 길신(神)·흉살(殺)로 봤지만, 현대에는 <strong className="text-[var(--color-ink)]">개인의 독특한 역량과 캐릭터</strong>로 풀이합니다.
          </CollapsibleSectionHeader>
          <div className="divider" />
          <div className="slide-card__body space-y-4">

            {/* 십이신살 — 기둥별 */}
            {natal.sibi_sinsal?.some(Boolean) && (
              <div>
                <p className="text-[10px] font-semibold text-[var(--color-ink-muted)] mb-2">십이신살(十二神殺)</p>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 2, 1, 0].map((origI) => {
                    const PILLAR_LABELS_SHORT = ["년주(年柱)", "월주(月柱)", "일주(日柱)", "시주(時柱)"];
                    const sinsalName = natal.sibi_sinsal[origI] || "";
                    const info = SIBI_SINSAL_INFO[sinsalName];
                    return (
                      <div key={origI} className="rounded-xl border text-center px-2 py-2 space-y-1"
                        style={{ borderColor: "var(--color-border-light)", backgroundColor: "var(--color-card)" }}>
                        <div className="text-[10px] text-[var(--color-ink-faint)]">{PILLAR_LABELS_SHORT[origI]}</div>
                        {sinsalName ? (
                          <>
                            <div className="text-sm font-semibold text-[var(--color-ink)] leading-tight">
                              {sinsalName}
                              {info && <span className="text-[9px] font-normal text-[var(--color-ink-faint)] ml-0.5">({info.hanja})</span>}
                            </div>
                            {info && (
                              <div className="text-[9px] text-[var(--color-ink-faint)] leading-snug">{info.meaning}</div>
                            )}
                          </>
                        ) : <div className="text-sm font-semibold text-[var(--color-ink-faint)]">—</div>}
                      </div>
                    );
                  })}
                </div>
                <KkachiTip>{buildSibiSinsalStory(natal.sibi_sinsal, name)}</KkachiTip>
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
                            src={`/kkachi/sinsal/sinsal_${sinsalName}.png`}
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
