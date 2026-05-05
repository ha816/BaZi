import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { NatalResult, PostnatalResult, SipsinInfo } from "@/types/analysis";
import { streamAiInterpretation } from "@/lib/api";
import { getElementInfo } from "@/lib/elementColors";
import InterpretSection from "@/components/InterpretSection";
import DetailToggle from "@/components/DetailToggle";
import TermBadge from "@/components/TermBadge";
import KkachiTip from "@/components/KkachiTip";
import CollapsibleSectionHeader from "@/components/CollapsibleSectionHeader";
import PillarDetail from "@/components/PillarDetail";
import ElementRadar from "@/components/ElementRadar";

const SAMJAE_STAGE_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  "들삼재": { color: "var(--color-earth)", bg: "#F5F0E7", border: "#DDD0B8" },
  "눌삼재": { color: "var(--color-fire)",  bg: "#F7EDEC", border: "#E8C4C0" },
  "날삼재": { color: "var(--color-earth)", bg: "#F5F0E7", border: "#DDD0B8" },
};

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
  type AiState = "idle" | "loading" | "done" | "error";
  const [aiState, setAiState] = useState<AiState>("idle");
  const [aiText, setAiText] = useState<string>("");

  useEffect(() => {
    const inputRaw = sessionStorage.getItem("kkachi_analysis_input");
    const name = sessionStorage.getItem("kkachi_analysis_name") ?? "";
    if (!inputRaw) return;
    const input = JSON.parse(inputRaw);
    setAiState("loading");
    streamAiInterpretation(input, name, (accumulated) => {
      setAiText(accumulated);
      setAiState("done");
    })
      .catch(() => setAiState("error"));
  }, []);

  const meInfo = getElementInfo(natal.my_element.name);
  const yongInfo = getElementInfo(natal.yongshin_info.name);
  const kisinInfo = natal.kisin_info?.name ? getElementInfo(natal.kisin_info.name) : null;

  const strengthColor =
    natal.strength_label === "신강(身強)" ? "var(--color-fire)"
    : natal.strength_label === "신약(身弱)" ? "var(--color-water)"
    : "var(--color-earth)";
  const strengthBg =
    natal.strength_label === "신강(身強)" ? "#F8CCC8"
    : natal.strength_label === "신약(身弱)" ? "#C4DDF5"
    : "#F5DCAA";

  const samjaeStage = postnatal.samjae?.type ?? null;
  const samjaeStyle = samjaeStage ? SAMJAE_STAGE_STYLE[samjaeStage] ?? null : null;

  const thisYearZodiac = postnatal.year_zodiac_relations[0] ?? null;
  const zodiacRelStyle = thisYearZodiac
    ? (RELATION_STYLE[thisYearZodiac.relation] ?? RELATION_STYLE["보통"])
    : null;

  return (
    <div className="space-y-4">

      {/* ① 나의 사주 핵심 — 만세력 + 용신·삼재 통합 */}
      <div className="slide-card">
        <CollapsibleSectionHeader title="나의 사주 핵심(本命 核心)">
          만세력으로 뽑은 <strong className="text-[var(--color-ink)]">사주팔자 8글자</strong>·<strong className="text-[var(--color-ink)]">오행(五行) 분포</strong>와, 처방에 해당하는 <strong className="text-[var(--color-ink)]">용신·기신(用神·忌神)</strong>·<strong className="text-[var(--color-ink)]">삼재(三災)</strong> 흐름까지 한 카드에 모았어요.
          <strong className="text-[var(--color-ink)]"> 일간(日干)</strong>은 나의 본질,
          <strong className="text-[var(--color-ink)]"> 주 오행</strong>은 가장 강한 기운,
          <strong className="text-[var(--color-ink)]"> 신강·신약(身強·身弱)</strong>은 그 기운의 균형 상태,
          <strong className="text-[var(--color-ink)]"> 용신</strong>은 채워야 할 처방 오행, <strong className="text-[var(--color-ink)]">기신</strong>은 가능한 줄여야 할 오행이에요.
          <strong className="text-[var(--color-ink)]"> 삼재</strong>는 12년 주기로 찾아오는 3년간의 액운기로, 들삼재→눌삼재→날삼재 순으로 흘러요.
        </CollapsibleSectionHeader>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          <KkachiTip>
            사주의 모든 해석은 여기서부터 출발해요. 만세력·오행 분포·용신·삼재 핵심을 모았어요.
          </KkachiTip>

          <PillarDetail pillars={natal.pillars} dayStem={natal.day_stem} basic />

          <ElementRadar stats={natal.element_stats} showNarrative={false} />

          <div className="flex flex-wrap gap-2">
            <span
              className="inline-flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full border"
              style={{ color: meInfo.color, backgroundColor: meInfo.bgColor, borderColor: meInfo.borderColor }}
            >
              {natal.day_stem} <span className="font-normal text-xs">{meInfo.korean}(일간)</span>
            </span>
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border"
              style={{ color: meInfo.color, backgroundColor: meInfo.bgColor, borderColor: meInfo.borderColor }}
            >
              주 오행: {meInfo.korean}
            </span>
            <span
              className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border"
              style={{ color: strengthColor, backgroundColor: strengthBg, borderColor: strengthColor }}
            >
              {natal.strength_label}
            </span>
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border"
              style={{ color: yongInfo.color, backgroundColor: yongInfo.bgColor, borderColor: yongInfo.borderColor }}
            >
              용신: {yongInfo.korean}({natal.yongshin_info.name})
            </span>
            {kisinInfo && (
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border"
                style={{ color: kisinInfo.color, backgroundColor: kisinInfo.bgColor, borderColor: kisinInfo.borderColor, opacity: 0.8 }}
              >
                기신: {kisinInfo.korean}({natal.kisin_info.name})
              </span>
            )}
            {samjaeStage && samjaeStyle && (
              <span
                className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border"
                style={{ color: samjaeStyle.color, backgroundColor: samjaeStyle.bg, borderColor: samjaeStyle.border }}
              >
                삼재: {samjaeStage}
              </span>
            )}
          </div>

          <KkachiTip>{postnatal.core_summary || natal.pillar_summary}</KkachiTip>
        </div>
      </div>

      {/* ② 올해 기운 흐름 */}
      <div className="slide-card">
        <CollapsibleSectionHeader title={`${postnatal.year}년 기운 흐름(歲運 流動)`}>
          사주는 태어날 때 정해진 그릇이지만, 해마다 들어오는 기운은 달라요.
          <strong className="text-[var(--color-ink)]"> 대운(大運)</strong>은 10년 단위 큰 분위기를 만들고,
          <strong className="text-[var(--color-ink)]"> 세운(歲運)</strong>은 그 위에 한 해의 표정을 그려요.
          세운의 <strong className="text-[var(--color-ink)]">천간(天干)</strong>은 사회·관계로 드러나는 변화이고,
          <strong className="text-[var(--color-ink)]"> 지지(地支)</strong>는 내 안에서 느끼는 결이에요.
          용신 기운이 들어온 해는 작은 결정도 더 쉽게 풀려요.
        </CollapsibleSectionHeader>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          <KkachiTip>
            올해 어떤 <strong>결의 기운</strong>이 들어오는지 살펴볼게요. 대운은 큰 분위기, 세운은 한 해의 표정이에요.
          </KkachiTip>
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
          <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">
            {buildSeunNarrative(postnatal.seun_stem, postnatal.seun_branch)}
          </p>
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

      {/* ③ 올해 십이지신 관계 */}
      {thisYearZodiac && zodiacRelStyle && (
        <div className="slide-card">
          <CollapsibleSectionHeader title="올해 십이지신 관계(歲支 衝合)">
            내 띠(년주의 지지)와 올해 띠 사이의 결을 봐요.
            <strong className="text-[var(--color-ink)]"> 삼합(三合)·육합(六合)</strong>은 흐름이 부드러워 협력과 확장에 유리하고,
            <strong className="text-[var(--color-ink)]"> 충(衝)</strong>은 변화·이동의 동력,
            <strong className="text-[var(--color-ink)]"> 원진(怨嗔)</strong>은 미묘한 갈등이 생기기 쉬운 결이에요.
            띠는 사주의 한 글자일 뿐이라 한 해 분위기의 단면으로 봐주세요.
          </CollapsibleSectionHeader>
          <div className="divider" />
          <div className="slide-card__body space-y-4">
            <KkachiTip>
              내 띠와 <strong>올해 띠</strong>가 어떤 결로 만나는지 살펴볼게요.
            </KkachiTip>
            <div className="flex items-center gap-4">
              <span className="text-4xl flex-shrink-0">
                {ZODIAC_EMOJI[thisYearZodiac.branch] ?? "🐾"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-semibold text-[var(--color-ink)]">
                    {thisYearZodiac.year}년 {thisYearZodiac.kor}띠 ({thisYearZodiac.ganji})
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
        <CollapsibleSectionHeader title="종합 조언 및 개운법(綜合 助言·開運法)">
          앞선 분석을 모아 <strong className="text-[var(--color-ink)]">일상에서 실천할 수 있는 행동 지침</strong>으로 정리한 카드예요.
          도움이 되는 <strong className="text-[var(--color-ink)]">색상·방향·습관</strong>까지 구체적으로 안내드려요.
          개운법(開運法)이란 작은 선택을 통해 운(運)의 결을 다듬어가는 동양 전통의 방법이에요.
          매일의 사소한 습관이 한 해의 분위기를 바꿔요.
        </CollapsibleSectionHeader>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          <KkachiTip>
            오늘부터 적용할 수 있는 <strong>실천 조언</strong>을 모았어요. 한 가지씩 가볍게 시작해보세요.
          </KkachiTip>
          <InterpretSection title="" blocks={postnatal.advice} variant="success" />
        </div>
      </div>

      {/* ⑤ 도움이 되는 기운 · 용신 */}
      <div className="slide-card">
        <CollapsibleSectionHeader title="도움이 되는 기운(用神 助力)">
          <strong className="text-[var(--color-ink)]">용신(用神)</strong>은 내 사주에서 부족하거나 약한 부분을 채워주는 핵심 오행이에요.
          용신 기운이 강해지는 해·시기·환경에서는 큰 일을 도모하기 좋고, 작은 결정도 한결 가볍게 풀려요.
          반대로 용신을 극(剋)하는 <strong className="text-[var(--color-ink)]">기신(忌神)</strong>의 시기엔 결정 속도를 늦추고 내실을 다지는 게 유리해요.
        </CollapsibleSectionHeader>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          <KkachiTip>
            <strong>용신</strong>은 내 사주의 균형을 잡아주는 처방 같은 오행이에요. 이 기운을 알아두면 시기·선택의 길잡이가 돼요.
          </KkachiTip>
          <InterpretSection title="" blocks={postnatal.yongshin} />
        </div>
      </div>

      {/* ⑥ AI 통합 해석 */}
      {aiState !== "idle" && (
        <div className="slide-card">
          <CollapsibleSectionHeader title="AI 통합 해석(人工知能 綜合 解釋)">
            앞선 모든 분석 데이터를 <strong className="text-[var(--color-ink)]">AI(qwen2.5)</strong>에게 전달해 생성한 통합 해석이에요.
            룰 엔진이 계산한 숫자와 구조를 바탕으로, <strong className="text-[var(--color-ink)]">자연스러운 언어</strong>로 풀어낸 종합 조언입니다.
          </CollapsibleSectionHeader>
          <div className="divider" />
          <div className="slide-card__body">
            {aiState === "loading" && (
              <div className="flex items-center gap-3 py-4 text-sm text-[var(--color-ink-faint)]">
                <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                AI가 사주 전체를 읽고 있어요 (1~2분 소요)...
              </div>
            )}
            {aiState === "done" && (
              <div className="prose-saju text-sm text-[var(--color-ink-light)] leading-relaxed">
                <ReactMarkdown>{aiText}</ReactMarkdown>
              </div>
            )}
            {aiState === "error" && (
              <p className="text-sm text-[var(--color-ink-faint)] py-2">
                AI 해석을 불러오지 못했어요. Ollama가 실행 중인지 확인해주세요.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
