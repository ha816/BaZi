import type { NatalResult, PostnatalResult, SipsinInfo } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";
import InterpretSection from "@/components/InterpretSection";
import DetailToggle from "@/components/DetailToggle";
import TermBadge from "@/components/TermBadge";
import KkachiTip from "@/components/KkachiTip";

const SIPSIN_YEAR_DESC: Record<string, string> = {
  "比肩": "나와 비슷한 기운이 들어와요. 경쟁이 늘거나 동료·친구와의 인연이 활발해지는 해예요.",
  "劫財": "경쟁과 지출이 늘기 쉬운 해예요. 투자나 보증은 신중하게, 대신 추진력은 강해져요.",
  "食神": "재능을 발휘하고 여유를 즐기기 좋은 해예요. 먹거리·취미·창작 활동에 복이 있어요.",
  "傷官": "표현욕이 강해지고 변화를 원하게 되는 해예요. 창의력은 높아지지만 말실수에 주의하세요.",
  "偏財": "활동적으로 돈을 벌 수 있는 해예요. 새로운 사업이나 투자 기회가 올 수 있어요.",
  "正財": "안정적인 수입과 재물 관리에 유리한 해예요. 꾸준한 노력이 보상받는 시기예요.",
  "偏官": "변화와 도전이 찾아오는 해예요. 승진이나 새 역할이 생길 수 있지만 스트레스도 커요.",
  "正官": "직장·사회적 지위가 안정되는 해예요. 인정받기 좋지만 책임도 무거워져요.",
  "偏印": "영감과 직감이 강해지는 해예요. 공부·연구·자격증에 유리하지만 생각이 많아지고 외로워질 수 있어요.",
  "正印": "학문적 지원과 안정이 들어오는 해예요. 어머니나 윗사람의 도움을 받기 좋은 시기예요.",
};

const ZODIAC_EMOJI: Record<string, string> = {
  "子": "🐭", "丑": "🐂", "寅": "🐯", "卯": "🐰", "辰": "🐲", "巳": "🐍",
  "午": "🐴", "未": "🐑", "申": "🐒", "酉": "🐓", "戌": "🐕", "亥": "🐗",
};

const RELATION_STYLE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  "삼합": { label: "삼합 ★", color: "#1A7A4A", bg: "#C8EDD8", border: "#5CB882" },
  "육합": { label: "육합 ★", color: "#1A5FA0", bg: "#C8DFF5", border: "#5A9ED0" },
  "보통": { label: "보통",    color: "#8A8A96", bg: "#F0F0F4", border: "#C8C8D4" },
  "원진": { label: "원진",    color: "#B05A20", bg: "#FCDDC0", border: "#E09050" },
  "충":   { label: "충",      color: "#B82020", bg: "#FBCFC8", border: "#E07070" },
};

function buildSeunNarrative(stem: SipsinInfo, branch: SipsinInfo): string {
  const stemDesc = SIPSIN_YEAR_DESC[stem.sipsin_name] ?? "";
  if (stem.sipsin_name === branch.sipsin_name) {
    return stemDesc + " 하늘과 땅 모두 같은 기운이라 이 영향이 특히 강하게 나타나요.";
  }
  return `${stemDesc} 여기에 ${SIPSIN_YEAR_DESC[branch.sipsin_name] ?? ""}`;
}

interface Props {
  natal: NatalResult;
  postnatal: PostnatalResult;
}

export default function AdviceTab({ natal, postnatal }: Props) {
  const meInfo = getElementInfo(natal.my_element.name);
  const yongInfo = getElementInfo(natal.yongshin_info.name);

  const strengthColor =
    natal.strength_label === "신강(身強)" ? "var(--color-fire)"
    : natal.strength_label === "신약(身弱)" ? "var(--color-water)"
    : "var(--color-earth)";
  const strengthBg =
    natal.strength_label === "신강(身強)" ? "#F8CCC8"
    : natal.strength_label === "신약(身弱)" ? "#C4DDF5"
    : "#F5DCAA";

  const thisYearZodiac = postnatal.year_zodiac_relations[0] ?? null;
  const zodiacRelStyle = thisYearZodiac
    ? (RELATION_STYLE[thisYearZodiac.relation] ?? RELATION_STYLE["보통"])
    : null;

  return (
    <div className="space-y-4">

      {/* ① 나의 사주 핵심 — 사주팔자·기운 요약 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">나의 사주 핵심</h3>
          <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">사주팔자·기운 탭 핵심 요약</p>
        </div>
        <div className="divider" />
        <div className="slide-card__body space-y-3">
          {/* 핵심 pill 행 */}
          <div className="flex flex-wrap gap-2">
            {/* 일간 */}
            <span
              className="inline-flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full border"
              style={{ color: meInfo.color, backgroundColor: meInfo.bgColor, borderColor: meInfo.borderColor }}
            >
              {natal.day_stem} <span className="font-normal text-xs">{meInfo.korean}(일간)</span>
            </span>
            {/* 주 오행 */}
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border"
              style={{ color: meInfo.color, backgroundColor: meInfo.bgColor, borderColor: meInfo.borderColor }}
            >
              주 오행: {meInfo.korean}
            </span>
            {/* 신강/신약 */}
            <span
              className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border"
              style={{ color: strengthColor, backgroundColor: strengthBg, borderColor: strengthColor }}
            >
              {natal.strength_label}
            </span>
            {/* 용신 */}
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border"
              style={{ color: yongInfo.color, backgroundColor: yongInfo.bgColor, borderColor: yongInfo.borderColor }}
            >
              용신: {yongInfo.korean}({natal.yongshin_info.name})
            </span>
          </div>
          {/* 사주 한 줄 요약 */}
          <KkachiTip>{natal.pillar_summary}</KkachiTip>
        </div>
      </div>

      {/* ② 올해 기운 흐름 — 대운·세운 요약 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">{postnatal.year}년 기운 흐름</h3>
          <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">대운·세운 탭 핵심 요약</p>
        </div>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          {/* 세운·대운 간지 */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-col items-center gap-0.5 rounded-lg px-4 py-2 bg-[var(--color-ivory)] border border-[var(--color-border-light)]">
              <span className="text-[10px] text-[var(--color-ink-faint)]">세운(올해)</span>
              <span className="font-heading text-xl font-bold text-[var(--color-ink)]">{postnatal.seun_ganji}</span>
            </div>
            {postnatal.current_daeun && (
              <div className="flex flex-col items-center gap-0.5 rounded-lg px-4 py-2 bg-[var(--color-ivory)] border border-[var(--color-border-light)]">
                <span className="text-[10px] text-[var(--color-ink-faint)]">현재 대운</span>
                <span className="font-heading text-xl font-bold text-[var(--color-ink)]">{postnatal.current_daeun.ganji}</span>
              </div>
            )}
            {postnatal.yongshin_in_seun && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full border"
                style={{ color: yongInfo.color, backgroundColor: yongInfo.bgColor, borderColor: yongInfo.borderColor }}
              >
                ✓ 용신 기운 있음
              </span>
            )}
          </div>
          {/* 세운 서술 */}
          <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">
            {buildSeunNarrative(postnatal.seun_stem, postnatal.seun_branch)}
          </p>
          {/* 천간·지지 상세 */}
          <DetailToggle>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "하늘 기운", term: "천간", info: postnatal.seun_stem },
                { label: "땅 기운",   term: "지지",  info: postnatal.seun_branch },
              ].map(({ label, term, info }) => (
                <div key={term} className="rounded-lg p-4 bg-[var(--color-ivory)] border border-[var(--color-border-light)]">
                  <div className="text-xs text-[var(--color-ink-faint)] mb-1">{label} <TermBadge term={term} /></div>
                  <div className="font-heading text-2xl font-bold text-[var(--color-ink)]">{info.char}</div>
                  <div className="text-xs text-[var(--color-ink-muted)] mt-1">{info.sipsin_name} — {info.domain}</div>
                </div>
              ))}
            </div>
          </DetailToggle>
        </div>
      </div>

      {/* ③ 올해 십이지신 관계 — 십이지신 탭 요약 */}
      {thisYearZodiac && zodiacRelStyle && (
        <div className="slide-card">
          <div className="slide-card__header">
            <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">올해 십이지신 관계</h3>
            <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">십이지신 탭 핵심 요약</p>
          </div>
          <div className="divider" />
          <div className="slide-card__body">
            <div className="flex items-center gap-4">
              <span className="text-4xl flex-shrink-0">
                {ZODIAC_EMOJI[thisYearZodiac.branch] ?? "🐾"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-[var(--color-ink)]">
                    {thisYearZodiac.year}년 {thisYearZodiac.kor}년 ({thisYearZodiac.ganji})
                  </span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                    style={{ color: zodiacRelStyle.color, backgroundColor: zodiacRelStyle.bg, borderColor: zodiacRelStyle.border }}
                  >
                    {zodiacRelStyle.label}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">
                  {thisYearZodiac.desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ④ 종합 조언 및 개운법 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">종합 조언 및 개운법</h3>
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          <InterpretSection title="" blocks={postnatal.advice} variant="success" />
        </div>
      </div>

      {/* ⑤ 도움이 되는 기운 · 용신 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">도움이 되는 기운 · 용신</h3>
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          <InterpretSection title="" blocks={postnatal.yongshin} />
        </div>
      </div>
    </div>
  );
}
