"use client";

import type { AnalysisResult } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";
import TermBadge from "./TermBadge";
import ScoreBar from "./ScoreBar";

interface Props {
  data: AnalysisResult;
}

function getElementPersonality(name: string): string {
  const map: Record<string, string> = {
    "木": "새싹처럼 성장을 추구하고, 사람들에게 따뜻하게 다가가는 성격이에요.",
    "火": "밝고 열정적인 에너지를 가졌고, 주변을 환하게 만드는 사람이에요.",
    "土": "묵직하고 안정적인 성격으로, 주변 사람들에게 신뢰를 주는 타입이에요.",
    "金": "판단력이 뛰어나고 원칙을 중시하며, 의리 있는 성격이에요.",
    "水": "유연하고 지혜로우며, 상황에 따라 잘 적응하는 사람이에요.",
  };
  return map[name] ?? "";
}

function getStrengthExplanation(value: number): string {
  if (value > 2) return "본인의 기운이 강한 편이에요. 주도적이고 독립적인 성향이 있어요.";
  if (value > 0) return "본인의 기운이 약간 강한 편이에요. 자기 주관이 뚜렷해요.";
  if (value === 0) return "기운이 균형 잡혀 있어요. 안정적인 흐름이에요.";
  if (value > -3) return "본인의 기운이 약간 약한 편이에요. 주변의 도움이 힘이 돼요.";
  return "본인의 기운이 약한 편이에요. 도움이 되는 기운이 특히 중요해요.";
}

function getYongshinExplanation(myElement: string, yongElement: string): string {
  const myInfo = getElementInfo(myElement);
  const yongInfo = getElementInfo(yongElement);
  return `${myInfo.korean}(${myElement}) 기운인 당신에게는 ${yongInfo.korean}(${yongElement})의 기운이 균형을 잡아줘요. ${yongInfo.korean} 기운이 있는 해에 운이 좋아져요.`;
}

function getSeunExplanation(inSeun: boolean, inDaeun: boolean): string {
  if (inSeun && inDaeun) return "올해는 나에게 좋은 기운이 올해 운과 10년 운 모두에 있어서, 여러 면에서 순조로운 한 해가 될 수 있어요.";
  if (inSeun) return "올해 운에 나에게 좋은 기운이 있어서, 새로운 기회가 찾아올 수 있는 해예요.";
  if (inDaeun) return "10년 큰 흐름에 나에게 좋은 기운이 있어서, 장기적으로는 좋은 시기를 보내고 있어요. 올해는 조금 신중하게 움직이면 좋겠어요.";
  return "올해는 나에게 좋은 기운이 직접 오지 않는 해예요. 무리하기보다 내실을 다지는 데 집중하면 좋겠어요.";
}

export default function FortuneSummary({ data }: Props) {
  const { natal, postnatal } = data;
  const meInfo = getElementInfo(natal.my_element.name);
  const yongInfo = getElementInfo(natal.yongshin_info.name);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
      <div
        className="px-7 py-5"
        style={{ background: `linear-gradient(135deg, ${meInfo.bgColor}, var(--color-card))` }}
      >
        <h2 className="font-heading text-xl font-semibold text-[var(--color-ink)]">
          분석 결과 요약
        </h2>
      </div>

      <div className="divider" />

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--color-border-light)]">
        <div className="px-7 py-6 text-center">
          <p className="text-xs text-[var(--color-ink-faint)] mb-3">
            나의 타고난 기운 <span className="opacity-60">(<TermBadge term="오행" />)</span>
          </p>
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 text-2xl font-heading font-bold text-white"
            style={{ backgroundColor: meInfo.color }}
          >
            {meInfo.korean[0]}
          </div>
          <p className="text-xl font-heading font-bold" style={{ color: meInfo.color }}>
            {meInfo.korean}
          </p>
          <p className="text-sm text-[var(--color-ink-muted)] mt-2 leading-relaxed">
            {getElementPersonality(natal.my_element.name)}
          </p>
        </div>

        <div className="px-7 py-6 text-center">
          <p className="text-xs text-[var(--color-ink-faint)] mb-3">
            기운의 세기 <span className="opacity-60">(<TermBadge term="강약" />)</span>
          </p>
          <p className="text-3xl font-heading font-bold text-[var(--color-ink)] mb-1">
            {natal.strength_label}
          </p>
          <p className="text-sm text-[var(--color-ink-faint)] mb-2">
            {natal.strength_value > 0 ? "+" : ""}{natal.strength_value}
          </p>
          <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
            {getStrengthExplanation(natal.strength_value)}
          </p>
        </div>

        <div className="px-7 py-6 text-center">
          <p className="text-xs text-[var(--color-ink-faint)] mb-3">
            도움이 되는 기운 <span className="opacity-60">(<TermBadge term="용신" />)</span>
          </p>
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 text-2xl font-heading font-bold text-white"
            style={{ backgroundColor: yongInfo.color }}
          >
            {yongInfo.korean[0]}
          </div>
          <p className="text-xl font-heading font-bold" style={{ color: yongInfo.color }}>
            {yongInfo.korean}
          </p>
          <p className="text-sm text-[var(--color-ink-muted)] mt-2 leading-relaxed">
            {getYongshinExplanation(natal.my_element.name, natal.yongshin_info.name)}
          </p>
        </div>
      </div>

      <div className="divider" />

      <div className="px-7 py-5">
        <h3 className="font-heading text-base font-semibold text-[var(--color-ink)] mb-2">
          {postnatal.year}년 올해의 운 — <span className="text-[var(--color-gold)]">{postnatal.seun_ganji}</span>
        </h3>
        <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed mb-3">
          {getSeunExplanation(postnatal.yongshin_in_seun, postnatal.yongshin_in_daeun)}
        </p>
        <div className="flex flex-wrap gap-2">
          <span
            className="px-4 py-1.5 rounded-full text-sm font-medium border"
            style={
              postnatal.yongshin_in_seun
                ? { color: "var(--color-wood)", borderColor: "var(--color-wood)", backgroundColor: getElementInfo("木").bgColor }
                : { color: "var(--color-ink-faint)", borderColor: "var(--color-border)", backgroundColor: "var(--color-ivory)" }
            }
          >
            올해 운에 나에게 좋은 기운 {postnatal.yongshin_in_seun ? "있음" : "없음"}
          </span>
          <span
            className="px-4 py-1.5 rounded-full text-sm font-medium border"
            style={
              postnatal.yongshin_in_daeun
                ? { color: "var(--color-wood)", borderColor: "var(--color-wood)", backgroundColor: getElementInfo("木").bgColor }
                : { color: "var(--color-ink-faint)", borderColor: "var(--color-border)", backgroundColor: "var(--color-ivory)" }
            }
          >
            10년 운에 나에게 좋은 기운 {postnatal.yongshin_in_daeun ? "있음" : "없음"}
          </span>
        </div>
      </div>

      <div className="divider" />

      <div className="px-7 py-5">
        <h3 className="text-sm text-[var(--color-ink-faint)] mb-4">영역별 운세</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
          {Object.entries(postnatal.domain_scores).map(([name, info]) => {
            const color =
              info.level === "high"
                ? "var(--color-wood)"
                : info.level === "medium"
                ? "var(--color-earth)"
                : "var(--color-metal)";
            return (
              <div key={name}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-sm font-medium text-[var(--color-ink)]">{name}</span>
                  <span className="text-xs font-semibold" style={{ color }}>{info.score}점</span>
                </div>
                <ScoreBar score={info.score} color={color} max={10} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
