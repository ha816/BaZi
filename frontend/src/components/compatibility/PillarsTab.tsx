import { getElementInfo } from "@/lib/elementColors";
import CollapsibleSectionHeader from "../CollapsibleSectionHeader";
import KkachiTip from "../KkachiTip";
import PillarPairDiagram from "../PillarPairDiagram";
import type { CompatTabProps } from "./types";

// 일주(日柱) 관계 3칸 — 백엔드 boolean 그대로
const DAY_CHECKS = [
  { key: "stem_combine", label: "천간합(天干合)", good: true },
  { key: "branch_combine", label: "지지 육합(六合)", good: true },
  { key: "branch_clash", label: "지지충(衝)", good: false },
] as const;

/** 팔자 나란히 — 일주 관계 3칸 + 같은 기둥끼리 비교(합·충·형·해·파) + 삼합 완성 */
export default function PillarsTab({ data, name1, name2 }: CompatTabProps) {
  const { pillar1_snapshot, pillar2_snapshot, pillar_relations, samhap_completions } = data;
  return (
    <div className="slide-card">
      <CollapsibleSectionHeader title="팔자 나란히(四柱 비교)">
        <p>년주·월주·일주·시주를 같은 자리끼리 짝지어 천간합·지지 육합·삼합·반합·충·원진·형·해·파를 봐요. 일주(日柱)가 가장 무겁고(1.0), 월주 0.6·시주 0.5·년주 0.3 가중이에요. 한쪽이라도 출생시간이 없으면 시주 쌍은 비교하지 않아요.</p>
      </CollapsibleSectionHeader>
      <div className="divider" />
      <div className="slide-card__body space-y-4">
        {!pillar1_snapshot || !pillar2_snapshot ? (
          <KkachiTip>이 결과에는 두 사주 비교 데이터가 없어요. 종합·영역별 탭은 그대로 볼 수 있어요.</KkachiTip>
        ) : (
          <>
            <KkachiTip>
              {name1}님과 {name2}님의 팔자를 같은 기둥끼리 짝지어 봤어요. 일주(日柱)가 두 분 사이를 가장 크게 좌우하고, 그다음이 월주·시주·년주 순이에요.
            </KkachiTip>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-[var(--color-ink-muted)]">
                일주(日柱) 관계 <span className="font-normal text-[var(--color-ink-faint)] ml-1">두 분의 일주끼리</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
              {DAY_CHECKS.map(({ key, label, good }) => {
                const on = data[key];
                const tone = !on
                  ? "text-[var(--color-ink-faint)] border-[var(--color-border-light)]"
                  : good
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-rose-700 bg-rose-50 border-rose-200";
                return (
                  <div key={key} className={`rounded-lg border px-2 py-2 text-center ${tone}`}>
                    <p className="text-[10px] font-semibold leading-snug">{label}</p>
                    <p className="text-base font-bold leading-tight">{on ? "✓" : "–"}</p>
                  </div>
                );
              })}
              </div>
            </div>

            <PillarPairDiagram
              p1={pillar1_snapshot}
              p2={pillar2_snapshot}
              relations={pillar_relations}
              name1={name1}
              name2={name2}
            />

            {samhap_completions.length > 0 && (
              <div className="space-y-2">
                {samhap_completions.map((c, i) => {
                  const info = getElementInfo(c.element);
                  return (
                    <div
                      key={i}
                      className="rounded-xl px-4 py-3 border flex items-center gap-3"
                      style={{ background: info.bgColor, borderColor: info.borderColor }}
                    >
                      <span className="font-heading text-2xl font-bold" style={{ color: info.color }}>
                        {c.branches.join("")}
                      </span>
                      <div className="flex-1 text-xs leading-relaxed" style={{ color: info.color }}>
                        <p className="font-semibold">
                          삼합 완성 — {info.label}({info.korean})국
                        </p>
                        <p className="opacity-80 mt-0.5">
                          {name1}님 {c.p1_branches.join("")} + {name2}님 {c.p2_branches.join("")} → 운명적 호흡
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
