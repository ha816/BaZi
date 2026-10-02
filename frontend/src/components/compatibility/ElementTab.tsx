import type { PillarSnapshot } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";
import CollapsibleSectionHeader from "../CollapsibleSectionHeader";
import KkachiTip from "../KkachiTip";
import OhengPairDiagram from "../OhengPairDiagram";
import type { CompatTabProps } from "./types";

const ELEMENTS_ORDER = ["木", "火", "土", "金", "水"];

function elementsToKor(arr: string[]): string {
  return arr.map((e) => `${getElementInfo(e).korean}(${e})`).join(", ");
}

function ElementBar({ snapshot, label }: { snapshot: PillarSnapshot; label: string }) {
  const total = Math.max(1, Object.values(snapshot.element_stats).reduce((a, b) => a + b, 0));
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-[var(--color-ink-muted)]">{label}</p>
      <p className="text-[10px] text-[var(--color-ink-faint)]">
        주오행 <span className="font-semibold" style={{ color: getElementInfo(snapshot.my_main_element).color }}>{getElementInfo(snapshot.my_main_element).korean}({snapshot.my_main_element})</span>
        {" · "}{snapshot.strength_label}
        {" · "}용신(用神) <span className="font-semibold" style={{ color: getElementInfo(snapshot.yongshin).color }}>{getElementInfo(snapshot.yongshin).korean}({snapshot.yongshin})</span>
      </p>
      <div className="space-y-1.5">
        {ELEMENTS_ORDER.map((el) => {
          const count = snapshot.element_stats[el] ?? 0;
          const pct = (count / total) * 100;
          const info = getElementInfo(el);
          return (
            <div key={el} className="flex items-center gap-2">
              <span className="w-7 text-xs font-bold" style={{ color: info.color }}>
                {info.korean}
              </span>
              <div className="flex-1 h-2 rounded-full" style={{ background: "var(--color-parchment)" }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${pct}%`, background: info.color }}
                />
              </div>
              <span className="w-5 text-right text-[10px] font-medium text-[var(--color-ink-faint)]">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 오행 보완 — 두 사람 오행 분포(주오행·강약·용신) · 합산 오각형 · 없는 오행 · 서로 채워주는 기운 */
export default function ElementTab({ data, name1, name2 }: CompatTabProps) {
  const { pillar1_snapshot, pillar2_snapshot, element_complement } = data;
  const lacks = [
    { name: name1, lacks: element_complement.p1_lacks },
    { name: name2, lacks: element_complement.p2_lacks },
  ].filter((x) => x.lacks.length > 0);
  return (
    <div className="slide-card">
      <CollapsibleSectionHeader title="오행 보완(五行)">
        <p>한쪽에 0개인 오행을 상대가 가지고 있으면 채워주는 기운으로, 둘 다 3개 이상이면 과중으로 봐요. 이 보완 점수가 종합 점수에 더해져요.</p>
      </CollapsibleSectionHeader>
      <div className="divider" />
      <div className="slide-card__body space-y-4">
        {!pillar1_snapshot || !pillar2_snapshot ? (
          <KkachiTip>이 결과에는 두 사주의 오행 데이터가 없어요. 종합·영역별 탭은 그대로 볼 수 있어요.</KkachiTip>
        ) : (
          <>
            <KkachiTip>
              한쪽에 부족한 오행을 상대가 가지고 있으면 서로를 채워주는 사이가 돼요. 반대로 같은 오행이 둘 다 강하면 충돌이 잦을 수 있어요.
            </KkachiTip>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ElementBar snapshot={pillar1_snapshot} label={`${name1}님`} />
              <ElementBar snapshot={pillar2_snapshot} label={`${name2}님`} />
            </div>

            <OhengPairDiagram
              p1={pillar1_snapshot}
              p2={pillar2_snapshot}
              name1={name1}
              name2={name2}
            />

            {lacks.length > 0 && (
              <div className="space-y-1.5">
                {lacks.map(({ name, lacks: els }, i) => (
                  <div key={i} className="flex items-center gap-1.5 flex-wrap text-[11px]">
                    <span className="text-[var(--color-ink-muted)]">{name}님에게 없는 오행</span>
                    {els.map((e) => {
                      const info = getElementInfo(e);
                      return (
                        <span key={e} className="px-2 py-0.5 rounded-full border font-semibold" style={{ color: info.color, borderColor: info.borderColor, background: info.bgColor }}>
                          {info.korean}({e})
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {element_complement.p2_provides.length > 0 && (
                <KkachiTip>
                  {name2}님이 {elementsToKor(element_complement.p2_provides)} 기운으로 {name1}님의 부족함을 채워줘요.
                </KkachiTip>
              )}
              {element_complement.p1_provides.length > 0 && (
                <KkachiTip>
                  {name1}님이 {elementsToKor(element_complement.p1_provides)} 기운으로 {name2}님의 부족함을 채워줘요.
                </KkachiTip>
              )}
              {element_complement.overlap_strong.length > 0 && (
                <KkachiTip>
                  두 분 모두 {elementsToKor(element_complement.overlap_strong)} 기운이 과중해 충돌이 생길 수 있어요.
                </KkachiTip>
              )}
              {element_complement.p1_provides.length === 0 &&
                element_complement.p2_provides.length === 0 &&
                element_complement.overlap_strong.length === 0 && (
                  <KkachiTip>오행 구성이 비슷한 균형 관계예요.</KkachiTip>
                )}
            </div>

            <p className="text-[10px] text-[var(--color-ink-faint)]">
              오행 보완 점수 <span className="font-semibold text-[var(--color-gold)]">{element_complement.score >= 0 ? "+" : ""}{element_complement.score}</span> (종합 점수에 반영)
            </p>
          </>
        )}
      </div>
    </div>
  );
}
