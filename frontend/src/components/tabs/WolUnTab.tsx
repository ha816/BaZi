"use client";
import type { NatalResult, PostnatalResult } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";
import { ganjiKor, REL_KIND_COLOR } from "@/lib/ganji";
import KkachiTip from "@/components/KkachiTip";
import CollapsibleSectionHeader from "@/components/CollapsibleSectionHeader";
import InlineCollapsibleHeader from "@/components/InlineCollapsibleHeader";
import OhaengRelationDiagram from "@/components/OhaengRelationDiagram";

interface Props {
  natal: NatalResult;
  postnatal: PostnatalResult;
}

export default function WolUnTab({ natal, postnatal }: Props) {
  const months = (postnatal.upcoming_months ?? []).slice(0, 4);
  if (months.length === 0) return null;
  const current = months[0];
  const stemSipsin = current.stem_sipsin;
  const branchSipsin = current.branch_sipsin;
  const stemSame = stemSipsin.sipsin_name === branchSipsin.sipsin_name;

  return (
    <div className="space-y-4">
      <div className="slide-card">
        <CollapsibleSectionHeader title="월운(月運)">
          1개월 단위로 흐르는 <strong className="text-[var(--color-ink)]">작은 결</strong>이에요. 세운(1년)이 한 해의 분위기라면 월운은 매달 변주되는 잔물결로, 단기 계획이나 타이밍 잡기에 참고하면 좋아요.
        </CollapsibleSectionHeader>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          <KkachiTip>
            가까운 달의 월운을 보고 나와의 조화를 살펴보세요.
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
              { label: "천간(天干)", sipsin: stemSipsin, element: current.stem_element },
              { label: "지지(地支)", sipsin: branchSipsin, element: current.branch_element },
            ].map(({ label, sipsin, element }) => {
              const info = getElementInfo(element);
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

          <KkachiTip>
            이번달은 <strong className="text-[var(--color-ink)]">{stemSipsin.sipsin_korean}({stemSipsin.sipsin_name})</strong>{!stemSame && <>·<strong className="text-[var(--color-ink)]">{branchSipsin.sipsin_korean}({branchSipsin.sipsin_name})</strong></>}의 흐름이에요. {stemSipsin.timing_meaning ?? ""}{!stemSame && <> 또 {branchSipsin.timing_meaning ?? ""}</>}
          </KkachiTip>
        </div>
      </div>
    </div>
  );
}
