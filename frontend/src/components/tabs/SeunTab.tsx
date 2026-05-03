import type { NatalResult, PostnatalResult } from "@/types/analysis";
import { getElementInfo, ganjiToElements } from "@/lib/elementColors";
import { ganjiKor, REL_KIND_COLOR } from "@/lib/ganji";
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

interface Props {
  natal: NatalResult;
  postnatal: PostnatalResult;
}

export default function SeunTab({ natal, postnatal }: Props) {
  const seunEls = ganjiToElements(postnatal.seun_ganji);

  const yearItems = [0, 1, 2].map((offset) => {
    const year = postnatal.year + offset;
    const ganji = GANJI_60[((year - 4) % 60 + 60) % 60];
    const els = ganjiToElements(ganji);
    return {
      year,
      ganji,
      stemEl: els.stem,
      branchEl: els.branch,
    };
  });

  return (
    <div className="space-y-4">
      {/* 세운(歲運) 섹션 */}
      <div className="slide-card">
        <CollapsibleSectionHeader title="세운(歲運)">
          개인 사주와 무관하게 <strong className="text-[var(--color-ink)]">연도만으로 정해지는 1년 단위 흐름</strong>이에요. 대운(10년)이 큰 챕터라면 세운은 매년 변주되는 잔물결로, 모든 사람이 같은 기운을 맞이해요.
        </CollapsibleSectionHeader>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          <KkachiTip>
            올해와 가까운 연도의 세운을 살펴보세요. 매년 바뀌는 결이 한 해의 분위기를 만들어요.
          </KkachiTip>
          {/* 3년 세운 그리드 */}
          <div className="grid grid-cols-3 gap-2">
            {yearItems.map(({ year, ganji, stemEl, branchEl }) => {
              const stemElInfo = getElementInfo(stemEl);
              const branchElInfo = getElementInfo(branchEl);
              return (
                <div
                  key={year}
                  className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 border border-[var(--color-border-light)] bg-[var(--color-card)]"
                >
                  <span className="text-[10px] font-semibold text-[var(--color-ink-light)]">{year}</span>
                  <span className="font-heading text-base font-bold text-[var(--color-ink)] text-center">{ganjiKor(ganji)}</span>
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

          {/* 세운과 나의 십신 */}
          <div className="divider" />
          <InlineCollapsibleHeader title="세운과 나의 십신">
            올해 세운의 천간({postnatal.seun_ganji[0]})·지지({postnatal.seun_ganji[1]})가 일주천간인 <strong className="text-[var(--color-ink)]">{natal.day_stem}({natal.my_element.name})</strong>과 맺는 관계를 십신(十神)으로 풀어보아요. 도움/억제, 음양 일치 여부에 따라 한 해의 결이 달라져요.
          </InlineCollapsibleHeader>
          <div className="divider" />
          <KkachiTip>
            내 일간({natal.day_stem})이 세운의 천간·지지와 어떻게 만나는지 십신(十神)으로 풀어볼게요.
          </KkachiTip>
          <OhaengRelationDiagram
            myElement={natal.my_element.name}
            stemElement={seunEls.stem}
            branchElement={seunEls.branch}
            myChar={natal.day_stem}
            stemChar={postnatal.seun_ganji[0]}
            branchChar={postnatal.seun_ganji[1]}
            label="세운"
            markerPrefix="se"
          />

          {/* 천간/지지 1×2 그리드 */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "천간(天干)", sipsin: postnatal.seun_stem },
              { label: "지지(地支)", sipsin: postnatal.seun_branch },
            ].map(({ label, sipsin }) => {
              const info = getElementInfo(sipsin.element);
              const myInfo = getElementInfo(natal.my_element.name);
              const myYY = natal.day_stem_yin_yang;
              const relColor = REL_KIND_COLOR[sipsin.rel_kind] ?? "#78716C";
              return (
                <div key={label}
                  className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-ivory)] p-3 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-[var(--color-ink-faint)]">{label}</span>
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
                        <span className="text-base font-bold" style={{ color: relColor }}>
                          {sipsin.rel.startsWith("나를") ? "←" : "→"}
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center"
                          style={{ backgroundColor: info.bgColor, border: `1.5px solid ${info.borderColor}` }}>
                          <span className="font-heading text-base font-bold leading-none" style={{ color: info.color }}>{sipsin.char}</span>
                          <span className="text-[8px] mt-0.5" style={{ color: info.color }}>{info.korean}</span>
                        </div>
                        <span className="text-[8px] text-[var(--color-ink-faint)]">{sipsin.target_yin_yang}</span>
                      </div>
                    </div>
                    <p className="text-[9px] text-center font-medium">
                      <span style={{ color: relColor }}>{sipsin.rel}</span>
                      <span className="text-[var(--color-ink)]"> · 음양 {sipsin.yinyang}</span>
                    </p>
                  </div>
                  <div className="w-full pt-1.5 border-t border-[var(--color-border-light)] text-center space-y-0.5 mt-0.5">
                    <p className="text-[10px] font-semibold text-[var(--color-ink-muted)]">
                      {label.startsWith("천간") ? "천간 십신" : "지지 십신"}
                    </p>
                    <p className="font-heading text-xl font-bold text-[var(--color-gold)]">
                      {sipsin.sipsin_korean}({sipsin.sipsin_name})
                    </p>
                    <p className="text-[10px] text-[var(--color-ink-faint)] leading-tight">{sipsin.domain}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 세운 십신 통합 풀이 */}
          {(() => {
            const stem = postnatal.seun_stem;
            const branch = postnatal.seun_branch;
            const stemSame = stem.sipsin_name === branch.sipsin_name;
            return (
              <KkachiTip>
                올해 세운은 <strong className="text-[var(--color-ink)]">{stem.sipsin_korean}({stem.sipsin_name})</strong>{!stemSame && <>·<strong className="text-[var(--color-ink)]">{branch.sipsin_korean}({branch.sipsin_name})</strong></>}의 흐름이에요. {stem.timing_meaning ?? ""}{!stemSame && <> 또 {branch.timing_meaning ?? ""}</>}
              </KkachiTip>
            );
          })()}
        </div>
      </div>

    </div>
  );
}
