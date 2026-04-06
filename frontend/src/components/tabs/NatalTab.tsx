import type { NatalResult, SipsinInfo, SibiUnseongInfo, SinsalInfo } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";
import PillarDetail from "@/components/PillarDetail";
import ElementRadar from "@/components/ElementRadar";
import SectionHeader from "@/components/SectionHeader";
import KkachiTip from "@/components/KkachiTip";

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

const SINSAL_COMBOS: { needs: string[]; message: string }[] = [
  { needs: ["문창귀인", "장성살"],    message: "똑똑한 리더 탄생! 지략과 카리스마를 모두 갖춘 당신은 조직의 핵심이 될 상이네요!" },
  { needs: ["도화살", "역마살"],      message: "카리스마 넘치는 글로벌 스타! 어딜 가도 주목받고, 낯선 곳에서 오히려 더 빛나는 타입이에요." },
  { needs: ["천을귀인", "문창귀인"],  message: "귀인의 도움으로 빛나는 학자! 배움의 길에서 뜻밖의 좋은 사람을 계속 만나게 돼요." },
  { needs: ["도화살", "장성살"],      message: "매력적인 리더! 인기와 권위를 동시에 갖춘 드문 조합이에요. 무대가 클수록 빛납니다." },
  { needs: ["역마살", "천을귀인"],    message: "움직일수록 귀인이 나타나는 타입이에요. 새로운 환경이 새로운 행운을 데려옵니다." },
];

export default function NatalTab({ natal, name }: Props) {
  const meInfo = getElementInfo(natal.my_element.name);
  const yongshinInfo = getElementInfo(natal.yongshin_info.name);
  const isStrong = natal.strength_value >= 0;

  return (
    <div className="space-y-4">
      {/* 정체성 요약 배너 */}
      <div className="slide-card" style={{ borderColor: meInfo.borderColor }}>
        <div className="slide-card__body">
          <div className="flex items-center gap-4">
            <div
              className="flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-0.5"
              style={{ backgroundColor: meInfo.bgColor, border: `1.5px solid ${meInfo.borderColor}` }}
            >
              <span className="font-heading text-3xl font-bold leading-none" style={{ color: meInfo.color }}>
                {natal.day_stem}
              </span>
              <span className="text-[10px] font-medium" style={{ color: meInfo.color }}>
                {meInfo.label}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full border font-semibold"
                  style={{ color: meInfo.color, backgroundColor: meInfo.bgColor, borderColor: meInfo.borderColor }}
                >
                  {meInfo.korean}({meInfo.label})
                </span>
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full border font-semibold"
                  style={{
                    color: isStrong ? "#C75B52" : "#4A7BA5",
                    backgroundColor: isStrong ? "#F7EDEC" : "#ECF1F6",
                    borderColor: isStrong ? "#E0B5B1" : "#B3CAD9",
                  }}
                >
                  {natal.strength_label}
                </span>
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full border font-semibold"
                  style={{ color: yongshinInfo.color, backgroundColor: yongshinInfo.bgColor, borderColor: yongshinInfo.borderColor }}
                >
                  용신 {yongshinInfo.korean}({yongshinInfo.label})
                </span>
              </div>
              <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">
                {natal.my_element.meaning} — {natal.yongshin_info.meaning}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 팔자 그리드 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <SectionHeader emoji="🌱" title="나의 사주팔자(四柱八字)" noMargin />
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          <PillarDetail
            pillars={natal.pillars}
            dayStem={natal.day_stem}
            pillarSummary={natal.pillar_summary ? `${name ? `${name}님의 ` : ""}${natal.pillar_summary}` : ""}
          />
        </div>
      </div>

      {/* 오행 분포 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">오행(五行) 분포</h3>
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          <ElementRadar stats={natal.element_stats} />
        </div>
      </div>

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
                natal.sipsin.reduce<Record<string, { sipsin_name: string; chars: string[]; count: number }>>(
                  (acc, s) => {
                    if (!acc[s.sipsin_name]) acc[s.sipsin_name] = { sipsin_name: s.sipsin_name, chars: [], count: 0 };
                    acc[s.sipsin_name].chars.push(s.char);
                    acc[s.sipsin_name].count++;
                    return acc;
                  }, {}
                )
              ).map(([sipsinName, group]) => {
                const info = SIPSIN_INFO[sipsinName];
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
      {natal.sinsal.length > 0 && (
        <div className="slide-card">
          <div className="slide-card__header">
            <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">신살(神殺)</h3>
            <p className="text-xs text-[var(--color-ink-faint)] mt-1 leading-relaxed">
              과거에는 '살(殺)'이라는 글자 때문에 무섭게 풀이하기도 했지만, 현대에는
              <strong className="text-[var(--color-ink-muted)]"> 개인의 독특한 역량이나 유통기한이 있는 기술</strong>로 풀이하면 훨씬 흥미롭습니다.
            </p>
          </div>
          <div className="divider" />
          <div className="slide-card__body space-y-3">
            {(() => {
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
                  <div className="grid grid-cols-2 gap-2">
                    {SINSAL_ORDER.filter((n) => !!myMap[n]).map((sinsalName) => {
                      const info = SINSAL_INFO[sinsalName];
                      return (
                        <div
                          key={sinsalName}
                          className="rounded-xl p-3 border overflow-hidden"
                          style={{ backgroundColor: info.bg, borderColor: info.border }}
                        >
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

                  {activeCombo && (
                    <KkachiTip>{activeCombo.message}</KkachiTip>
                  )}

                  {!hasBaekho && !activeCombo && (
                    <KkachiTip>{buildSinsalNarrative(natal.sinsal, name)}</KkachiTip>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
