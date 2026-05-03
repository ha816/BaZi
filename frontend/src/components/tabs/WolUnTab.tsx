"use client";
import type { NatalResult, PostnatalResult } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";
import KkachiTip from "@/components/KkachiTip";
import CollapsibleSectionHeader from "@/components/CollapsibleSectionHeader";
import InlineCollapsibleHeader from "@/components/InlineCollapsibleHeader";
import OhaengRelationDiagram from "@/components/OhaengRelationDiagram";

const STEM_KOR: Record<string, string> = {
  甲:"갑", 乙:"을", 丙:"병", 丁:"정", 戊:"무",
  己:"기", 庚:"경", 辛:"신", 壬:"임", 癸:"계",
};
const BRANCH_KOR: Record<string, string> = {
  子:"자", 丑:"축", 寅:"인", 卯:"묘", 辰:"진", 巳:"사",
  午:"오", 未:"미", 申:"신", 酉:"유", 戌:"술", 亥:"해",
};
function ganjiKor(ganji: string): string {
  const s = STEM_KOR[ganji[0]] ?? ganji[0];
  const b = BRANCH_KOR[ganji[1]] ?? ganji[1];
  return `${s}${b}(${ganji})`;
}

const SIPSIN_KOR: Record<string, string> = {
  "比肩": "비견", "劫財": "겁재", "食神": "식신", "傷官": "상관",
  "偏財": "편재", "正財": "정재", "偏官": "편관", "正官": "정관",
  "偏印": "편인", "正印": "정인",
};

const SIPSIN_DERIVE: Record<string, { rel: string; yinyang: string; relColor: string }> = {
  "比肩": { rel: "같은 오행",   yinyang: "일치", relColor: "#78716C" },
  "劫財": { rel: "같은 오행",   yinyang: "다름", relColor: "#78716C" },
  "食神": { rel: "내가 도움",   yinyang: "일치", relColor: "#1B6B3A" },
  "傷官": { rel: "내가 도움",   yinyang: "다름", relColor: "#1B6B3A" },
  "偏財": { rel: "내가 억제", yinyang: "일치", relColor: "#C0392B" },
  "正財": { rel: "내가 억제", yinyang: "다름", relColor: "#C0392B" },
  "偏官": { rel: "나를 억제", yinyang: "일치", relColor: "#C0392B" },
  "正官": { rel: "나를 억제", yinyang: "다름", relColor: "#C0392B" },
  "偏印": { rel: "나를 도움",   yinyang: "일치", relColor: "#1B6B3A" },
  "正印": { rel: "나를 도움",   yinyang: "다름", relColor: "#1B6B3A" },
};

const SIPSIN_MEANING: Record<string, string> = {
  "比肩": "나와 같은 에너지가 들어오는 시기예요. 독립심과 자아가 강해지고, 주체적으로 길을 개척하게 돼요.",
  "劫財": "경쟁과 나눔의 기운이에요. 협력하면 힘이 되지만, 재물이 새는 흐름도 있으니 지출을 점검해 봐요.",
  "食神": "재능이 빛나고 먹을 복이 따르는 시기예요. 하고 싶은 것을 표현하고 베풀수록 더 많이 돌아와요.",
  "傷官": "창의력과 개성이 폭발하는 시기예요. 틀을 깨는 에너지가 강하지만, 조직 내 마찰은 주의해야 해요.",
  "偏財": "적극적인 재물 운이 따르는 시기예요. 투자·사업·새로운 기회에 민감하게 반응하면 좋아요.",
  "正財": "안정적인 수입과 저축의 기운이에요. 꾸준히 성실하게 쌓아가면 재물이 단단해져요.",
  "偏官": "강한 자극과 도전이 오는 시기예요. 압박감이 있지만 그 안에 성장의 기회가 숨어 있어요.",
  "正官": "명예와 책임의 기운이에요. 사회적 인정을 받거나 직책·역할의 변화가 찾아올 수 있어요.",
  "偏印": "직관과 학문의 기운이에요. 공부·연구·자기계발에 집중하기 좋고, 전문성이 쌓이는 시기예요.",
  "正印": "배움과 보호의 기운이에요. 어른이나 스승의 도움을 받을 수 있고, 마음이 안정되는 시기예요.",
};

interface Props {
  natal: NatalResult;
  postnatal: PostnatalResult;
}

export default function WolUnTab({ natal, postnatal }: Props) {
  const months = (postnatal.upcoming_months ?? []).slice(0, 4);
  if (months.length === 0) return null;
  const current = months[0];
  const stemSame = current.stem_sipsin.name === current.branch_sipsin.name;
  const stemKor = SIPSIN_KOR[current.stem_sipsin.name] ?? current.stem_sipsin.name;
  const branchKor = SIPSIN_KOR[current.branch_sipsin.name] ?? current.branch_sipsin.name;

  return (
    <div className="space-y-4">
      <div className="slide-card">
        <CollapsibleSectionHeader title="월운(月運)">
          1개월 단위로 흐르는 <strong className="text-[var(--color-ink)]">작은 결</strong>이에요. 세운(1년)이 한 해의 분위기라면 월운은 매달 변주되는 잔물결로, 단기 계획이나 타이밍 잡기에 참고하면 좋아요.
        </CollapsibleSectionHeader>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          <KkachiTip>
            이번달과 가까운 달의 월운을 살펴보세요. 매달 바뀌는 결이 한 달의 분위기를 만들어요.
          </KkachiTip>
          <div className="grid grid-cols-4 gap-2">
            {months.map((m, i) => {
              const stemElInfo = getElementInfo(m.stem_element);
              const branchElInfo = getElementInfo(m.branch_element);
              const isCurrent = i === 0;
              return (
                <div key={`${m.year}-${m.month}`}
                  className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 border"
                  style={{
                    borderColor: isCurrent ? "var(--color-gold)" : "var(--color-border-light)",
                    backgroundColor: isCurrent ? "var(--color-gold-faint)" : "var(--color-card)",
                  }}
                >
                  <span className="text-[10px] font-semibold text-[var(--color-ink-light)]">
                    {m.month}월
                  </span>
                  <span className="font-heading text-base font-bold text-[var(--color-ink)] text-center">
                    {ganjiKor(m.ganji)}
                  </span>
                  <div className="flex gap-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ color: stemElInfo.color, backgroundColor: stemElInfo.bgColor }}>
                      {stemElInfo.korean}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ color: branchElInfo.color, backgroundColor: branchElInfo.bgColor }}>
                      {branchElInfo.korean}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 월운과 나의 십신 */}
          <div className="divider" />
          <InlineCollapsibleHeader title="월운과 나의 십신">
            이번달 월운의 천간({current.ganji[0]})·지지({current.ganji[1]})가 일주천간인 <strong className="text-[var(--color-ink)]">{natal.day_stem}({natal.my_element.name})</strong>과 맺는 관계를 십신(十神)으로 풀어보아요.
          </InlineCollapsibleHeader>
          <div className="divider" />
          <KkachiTip>
            내 일간({natal.day_stem})이 이번달 천간·지지와 어떻게 만나는지 십신(十神)으로 풀어볼게요.
          </KkachiTip>
          <OhaengRelationDiagram
            myElement={natal.my_element.name}
            stemElement={current.stem_element}
            branchElement={current.branch_element}
            myChar={natal.day_stem}
            stemChar={current.ganji[0]}
            branchChar={current.ganji[1]}
            label="월운"
            markerPrefix="wo"
          />
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "천간(天干)", char: current.ganji[0], element: current.stem_element, sipsin: current.stem_sipsin },
              { label: "지지(地支)", char: current.ganji[1], element: current.branch_element, sipsin: current.branch_sipsin },
            ].map(({ label, char, element, sipsin }) => {
              const info = getElementInfo(element);
              const d = SIPSIN_DERIVE[sipsin.name];
              const myInfo = getElementInfo(natal.my_element.name);
              const myYY = natal.day_stem_yin_yang;
              const tgtYY = d ? (d.yinyang === "일치" ? myYY : (myYY === "양" ? "음" : "양")) : "";
              return (
                <div key={label}
                  className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-ivory)] p-3 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-[var(--color-ink-faint)]">{label}</span>
                  {d && (
                    <div className="w-full space-y-1.5">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center"
                            style={{ backgroundColor: myInfo.bgColor, border: `1.5px solid ${myInfo.borderColor}` }}>
                            <span className="font-heading text-base font-bold leading-none" style={{ color: myInfo.color }}>{natal.day_stem}</span>
                            <span className="text-[8px] mt-0.5" style={{ color: myInfo.color }}>{myInfo.korean}</span>
                          </div>
                          <span className="text-[8px] text-[var(--color-ink-faint)]">{myYY}</span>
                        </div>
                        <div className="flex items-center pb-4">
                          <span className="text-base font-bold" style={{ color: d.relColor }}>
                            {d.rel.startsWith("나를") ? "←" : "→"}
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center"
                            style={{ backgroundColor: info.bgColor, border: `1.5px solid ${info.borderColor}` }}>
                            <span className="font-heading text-base font-bold leading-none" style={{ color: info.color }}>{char}</span>
                            <span className="text-[8px] mt-0.5" style={{ color: info.color }}>{info.korean}</span>
                          </div>
                          <span className="text-[8px] text-[var(--color-ink-faint)]">{tgtYY}</span>
                        </div>
                      </div>
                      <p className="text-[9px] text-center font-medium">
                        <span style={{ color: d.relColor }}>{d.rel}</span>
                        <span className="text-[var(--color-ink)]"> · 음양 {d.yinyang}</span>
                      </p>
                    </div>
                  )}
                  <div className="w-full pt-1.5 border-t border-[var(--color-border-light)] text-center space-y-0.5 mt-0.5">
                    <p className="text-[10px] font-semibold text-[var(--color-ink-muted)]">
                      {label.startsWith("천간") ? "천간 십신" : "지지 십신"}
                    </p>
                    <p className="font-heading text-xl font-bold text-[var(--color-gold)]">
                      {SIPSIN_KOR[sipsin.name] ?? sipsin.name}({sipsin.name})
                    </p>
                    <p className="text-[10px] text-[var(--color-ink-faint)] leading-tight">{sipsin.domain}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <KkachiTip>
            이번달은 <strong className="text-[var(--color-ink)]">{stemKor}({current.stem_sipsin.name})</strong>{!stemSame && <>·<strong className="text-[var(--color-ink)]">{branchKor}({current.branch_sipsin.name})</strong></>}의 흐름이에요. {SIPSIN_MEANING[current.stem_sipsin.name] ?? ""}{!stemSame && <> 또 {SIPSIN_MEANING[current.branch_sipsin.name] ?? ""}</>}
          </KkachiTip>
        </div>
      </div>
    </div>
  );
}
