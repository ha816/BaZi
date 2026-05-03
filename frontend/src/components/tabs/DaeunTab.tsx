import type { NatalResult, PostnatalResult } from "@/types/analysis";
import { getElementInfo, ganjiToElements } from "@/lib/elementColors";
import DaeunTimeline from "@/components/DaeunTimeline";
import KkachiTip from "@/components/KkachiTip";
import CollapsibleSectionHeader from "@/components/CollapsibleSectionHeader";
import InlineCollapsibleHeader from "@/components/InlineCollapsibleHeader";
import OhaengRelationDiagram from "@/components/OhaengRelationDiagram";



const GANJI_60 = [
  "甲子","乙丑","丙寅","丁卯","戊辰","己巳","庚午","辛未","壬申","癸酉",
  "甲戌","乙亥","丙子","丁丑","戊寅","己卯","庚辰","辛巳","壬午","癸未",
  "甲申","乙酉","丙戌","丁亥","戊子","己丑","庚寅","辛卯","壬辰","癸巳",
  "甲午","乙未","丙申","丁酉","戊戌","己亥","庚子","辛丑","壬寅","癸卯",
  "甲辰","乙巳","丙午","丁未","戊申","己酉","庚戌","辛亥","壬子","癸丑",
  "甲寅","乙卯","丙辰","丁巳","戊午","己未","庚申","辛酉","壬戌","癸亥",
];

const YIN_YEAR_STEMS = new Set(["乙","丁","己","辛","癸"]);


const SIPSIN_KOR: Record<string, string> = {
  "比肩": "비견", "劫財": "겁재", "食神": "식신", "傷官": "상관",
  "偏財": "편재", "正財": "정재", "偏官": "편관", "正官": "정관",
  "偏印": "편인", "正印": "정인",
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

const BRANCH_SOLAR_TERM: Record<string, string> = {
  "寅":"입춘(立春)", "卯":"경칩(驚蟄)", "辰":"청명(淸明)", "巳":"입하(立夏)",
  "午":"망종(芒種)", "未":"소서(小暑)", "申":"입추(立秋)", "酉":"백로(白露)",
  "戌":"한로(寒露)", "亥":"입동(立冬)", "子":"대설(大雪)", "丑":"소한(小寒)",
};


interface Props {
  natal: NatalResult;
  postnatal: PostnatalResult;
  name?: string;
}

export default function DaeunTab({ natal, postnatal }: Props) {
  const currentDaeun = postnatal.daeun.find(d => d.is_current) ?? null;
  // 순행/역행 추론: 첫 대운이 월주의 이전 글자면 역행, 다음 글자면 순행
  const monthPillar = natal.pillars[1];
  const firstDaeun = postnatal.daeun[0];
  const daeunNumber = firstDaeun?.start_age ?? 0;
  const yearStem = natal.pillars[0]?.[0] ?? "";
  const isYinYear = YIN_YEAR_STEMS.has(yearStem);
  const mIdx = GANJI_60.indexOf(monthPillar);
  const dIdx = firstDaeun ? GANJI_60.indexOf(firstDaeun.ganji) : -1;
  const isReverse = mIdx !== -1 && dIdx !== -1 && dIdx === (mIdx - 1 + 60) % 60;
  // 성별 역추론: 음의 해 역행 = 남성, 음의 해 순행 = 여성 (양의 해는 반대)
  const isMale = isYinYear ? isReverse : !isReverse;
  const yearBranch = natal.pillars[0]?.[1] ?? "";
  // 역행: 현재 월주의 절기, 순행: 다음 달(첫 대운)의 절기
  const nearestSolarTerm = isReverse
    ? BRANCH_SOLAR_TERM[monthPillar[1]] ?? ""
    : BRANCH_SOLAR_TERM[firstDaeun?.ganji[1] ?? ""] ?? "";

  return (
    <div className="space-y-4">
      {/* 현재 나의 대운 */}
      {currentDaeun && (() => {
        return (
          <div className="slide-card">
            <CollapsibleSectionHeader title="대운(大運)">
              <p>
                10년 주기로 바뀌는 <strong className="text-[var(--color-ink)]">큰 운의 흐름</strong>이에요. 인생의 큰 챕터를 만드는 에너지로, 월주(月柱)에서 시작해 60갑자를 따라 한 칸씩 흘러가요. 출생 시점의 절기·성별에 따라 순행/역행이 정해져요.
              </p>
              {/* 대운 계산법 */}
              <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-card)] p-4 space-y-3.5">
                <p className="text-[11px] font-semibold text-[var(--color-ink-muted)]">대운 계산법</p>

                {/* ① 방향 */}
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-[var(--color-gold)] w-4 flex-shrink-0 mt-0.5">①</span>
                  <div className="flex-1">
                    <p className="text-[10px] text-[var(--color-ink-faint)] mb-1.5">순행/역행 구하기</p>
                    <p className="text-[10px] text-[var(--color-ink-faint)] leading-relaxed">
                      태어난 해는 {isYinYear ? "음(陰)" : "양(陽)"}의 해({yearBranch})로,{" "}
                      {isMale ? "남성(양)" : "여성(음)"}과 {isReverse ? "불일치" : "일치"}하여{" "}
                      {isReverse ? "역행" : "순행"}
                    </p>
                  </div>
                </div>

                {/* ② 출발점 */}
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-[var(--color-gold)] w-4 flex-shrink-0 mt-0.5">②</span>
                  <div className="flex-1">
                    <p className="text-[10px] text-[var(--color-ink-faint)] mb-1.5">
                      {isReverse ? "역행" : "순행"}이므로 월주 기준 60갑자 순회에서 한 칸 이동
                    </p>
                    {/* 60갑자 스트립 */}
                    {mIdx !== -1 && (
                      <div className="flex items-center gap-1 overflow-hidden">
                        {[-1, 0, 1].map((offset) => {
                          const idx = (mIdx + offset + 60) % 60;
                          const ganji = GANJI_60[idx];
                          const isMonth = offset === 0;
                          const isFirst = firstDaeun && ganji === firstDaeun.ganji && offset !== 0;
                          return (
                            <div key={offset} className="flex flex-col items-center gap-0.5">
                              <span className="text-[9px] font-semibold" style={{
                                color: isMonth ? "var(--color-ink-faint)"
                                  : offset === (isReverse ? -1 : 1) ? (isReverse ? "#C75B52" : "#1B6B3A")
                                  : "transparent",
                              }}>
                                {isMonth ? "月柱" : offset === (isReverse ? -1 : 1) ? "첫 대운" : "."}
                              </span>
                              <span className={`font-heading text-xs font-bold px-2 py-1 rounded-lg border ${
                                isMonth
                                  ? "border-[var(--color-border-light)] bg-white text-[var(--color-ink)]"
                                  : isFirst
                                  ? "text-[var(--color-gold)]"
                                  : "text-[var(--color-ink-faint)]"
                              }`}
                                style={isFirst ? { backgroundColor: "#FFF8EC", borderColor: "var(--color-gold)" } :
                                  !isMonth ? { backgroundColor: "var(--color-ivory)", borderColor: "transparent" } : {}}>
                                {ganji}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* ③ 시작 나이 */}
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-[var(--color-gold)] w-4 flex-shrink-0 mt-0.5">③</span>
                  <div>
                    <p className="text-[10px] text-[var(--color-ink-faint)] mb-1.5">대운 시작 나이 - 대운수(大運數)</p>
                    <p className="text-[10px] text-[var(--color-ink-faint)] leading-relaxed">
                      태어난 날부터 절기{nearestSolarTerm ? `(${nearestSolarTerm})` : ""}까지 날수를 세면 약 {daeunNumber * 3}일. {daeunNumber * 3}을 3으로 나누면 {daeunNumber}세 — 대운이 시작되는 나이. (명리학 3일 = 1년 취급)
                    </p>
                  </div>
                </div>
              </div>
            </CollapsibleSectionHeader>
            <div className="divider" />
            <div className="slide-card__body space-y-4">
              <KkachiTip>
                대운은 10년씩 머무르는 큰 흐름이에요. 내 용신({natal.yongshin_info.name})과 대운에 따라 그 시기의 방향성을 짐작해볼 수 있어요.
              </KkachiTip>

              {/* 대운 60갑자 순회 */}
              <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-ivory)] p-4 space-y-3">
                <p className="text-[11px] font-semibold text-[var(--color-ink-muted)]">대운 60갑자 순회</p>
                <DaeunTimeline daeun={postnatal.daeun} />
              </div>
              {(() => {
                const els = ganjiToElements(currentDaeun.ganji);
                const stemKor = getElementInfo(els.stem).korean;
                const branchKor = getElementInfo(els.branch).korean;
                return (
                  <KkachiTip>
                    {currentDaeun.has_yongshin
                      ? <>축하합니다! 현재 <strong>대운({currentDaeun.ganji})</strong>에 머물고 있어요. 용신 기운이 들어와 큰 흐름이 부드러운 시기예요.</>
                      : <>현재 대운은 <strong>{stemKor}·{branchKor}</strong> 오행을 거치는 시기예요. 용신({natal.yongshin_info.meaning}({natal.yongshin_info.name}))과 결이 다르니 환경·사람의 도움을 잘 살피면 흐름이 부드러워져요.</>
                    }
                  </KkachiTip>
                );
              })()}

              {/* 현재 대운 분석 — 십신 */}
              {postnatal.daeun_sipsin.length >= 2 && (
                <>
                  <div className="divider" />
                  <InlineCollapsibleHeader title="대운과 나의 십신">
                    현재 대운의 천간({currentDaeun.ganji[0]})·지지({currentDaeun.ganji[1]})가 일주천간인 <strong className="text-[var(--color-ink)]">{natal.day_stem}({natal.my_element.name})</strong>과 맺는 관계를 십신(十神)으로 풀어보아요. 도움/억제, 음양 일치 여부에 따라 시기의 결이 달라져요.
                  </InlineCollapsibleHeader>
                  <div className="divider" />
                  <KkachiTip>
                    내 일간({natal.day_stem})이 대운의 천간·지지와 어떻게 만나는지 십신(十神)으로 풀어볼게요.
                  </KkachiTip>
                  <OhaengRelationDiagram
                    myElement={natal.my_element.name}
                    stemElement={postnatal.daeun_sipsin[0].element}
                    branchElement={postnatal.daeun_sipsin[1].element}
                    myChar={natal.day_stem}
                    stemChar={currentDaeun.ganji[0]}
                    branchChar={currentDaeun.ganji[1]}
                    label="대운"
                    markerPrefix="da"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "천간(天干)", sipsin: postnatal.daeun_sipsin[0] },
                      { label: "지지(地支)", sipsin: postnatal.daeun_sipsin[1] },
                    ].map(({ label, sipsin }) => {
                      const info = getElementInfo(sipsin.element);
                      return (
                        <div key={label}
                          className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-ivory)] p-3 flex flex-col items-center gap-1.5">
                          <span className="text-[10px] text-[var(--color-ink-faint)]">{label}</span>
                            {SIPSIN_DERIVE[sipsin.sipsin_name] && (() => {
                            const d = SIPSIN_DERIVE[sipsin.sipsin_name];
                            const myKor = getElementInfo(natal.my_element.name).korean;
                            const tgtKor = getElementInfo(sipsin.element).korean;
                            const myYY = natal.day_stem_yin_yang;
                            const tgtYY = d.yinyang === "일치" ? myYY : (myYY === "양" ? "음" : "양");
                            return (
                              <div className="w-full space-y-1.5">
                                <div className="flex items-center justify-center gap-2">
                                  {/* 일간 chip */}
                                  <div className="flex flex-col items-center gap-0.5">
                                    <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center"
                                      style={{ backgroundColor: getElementInfo(natal.my_element.name).bgColor, border: `1.5px solid ${getElementInfo(natal.my_element.name).borderColor}` }}>
                                      <span className="font-heading text-base font-bold leading-none" style={{ color: getElementInfo(natal.my_element.name).color }}>{natal.day_stem}</span>
                                      <span className="text-[8px] mt-0.5" style={{ color: getElementInfo(natal.my_element.name).color }}>{myKor}</span>
                                    </div>
                                    <span className="text-[8px] text-[var(--color-ink-faint)]">{myYY}</span>
                                  </div>
                                  {/* 화살표 */}
                                  <div className="flex items-center pb-4">
                                    <span className="text-base font-bold" style={{ color: d.relColor }}>→</span>
                                  </div>
                                  {/* 대운 chip */}
                                  <div className="flex flex-col items-center gap-0.5">
                                    <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center"
                                      style={{ backgroundColor: info.bgColor, border: `1.5px solid ${info.borderColor}` }}>
                                      <span className="font-heading text-base font-bold leading-none" style={{ color: info.color }}>{sipsin.char}</span>
                                      <span className="text-[8px] mt-0.5" style={{ color: info.color }}>{tgtKor}</span>
                                    </div>
                                    <span className="text-[8px] text-[var(--color-ink-faint)]">{tgtYY}</span>
                                  </div>
                                </div>
                                <p className="text-[9px] text-center font-medium">
                                  <span style={{ color: d.relColor }}>{d.rel}</span>
                                  <span className="text-[var(--color-ink)]"> · 음양 {d.yinyang}</span>
                                </p>
                              </div>
                            );
                          })()}
                          <div className="w-full pt-1.5 border-t border-[var(--color-border-light)] text-center space-y-0.5 mt-0.5">
                            <p className="text-[10px] font-semibold text-[var(--color-ink-muted)]">
                              {label.startsWith("천간") ? "천간 십신" : "지지 십신"}
                            </p>
                            <p className="font-heading text-xl font-bold text-[var(--color-gold)]">
                              {SIPSIN_KOR[sipsin.sipsin_name] ?? sipsin.sipsin_name}({sipsin.sipsin_name})
                            </p>
                            <p className="text-[10px] text-[var(--color-ink-faint)] leading-tight">{sipsin.domain}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <KkachiTip>
                    이번 대운은 <strong className="text-[var(--color-ink)]">{SIPSIN_KOR[postnatal.daeun_sipsin[0].sipsin_name] ?? postnatal.daeun_sipsin[0].sipsin_name}({postnatal.daeun_sipsin[0].sipsin_name})</strong>·<strong className="text-[var(--color-ink)]">{SIPSIN_KOR[postnatal.daeun_sipsin[1].sipsin_name] ?? postnatal.daeun_sipsin[1].sipsin_name}({postnatal.daeun_sipsin[1].sipsin_name})</strong>의 흐름이에요. {SIPSIN_MEANING[postnatal.daeun_sipsin[0].sipsin_name] ?? ""} 또 {SIPSIN_MEANING[postnatal.daeun_sipsin[1].sipsin_name] ?? ""}
                  </KkachiTip>
                </>
              )}
            </div>
          </div>
        );
      })()}

    </div>
  );
}