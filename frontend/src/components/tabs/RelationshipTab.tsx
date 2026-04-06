import type { PostnatalResult, ClashInfo, CombineInfo } from "@/types/analysis";
import InterpretSection from "@/components/InterpretSection";

const PILLAR_LABEL_MAP: Record<string, string> = {
  "년주": "조상·사회 영역", "월주": "부모·직장 영역",
  "일주": "나·배우자 영역", "시주": "자녀·미래 영역",
};

function buildClashNarrative(clashes: ClashInfo[]): string {
  if (clashes.length === 0) return "";
  const areas = [...new Set(clashes.map((c) => PILLAR_LABEL_MAP[c.pillar] ?? c.pillar))];
  return `올해 기운이 내 사주의 ${areas.join(", ")}과 부딪혀요. 이 영역에서 갑작스러운 변화나 갈등이 생길 수 있으니 유연하게 대처하세요.`;
}

function buildCombineNarrative(combines: CombineInfo[]): string {
  if (combines.length === 0) return "";
  const areas = [...new Set(combines.map((c) => PILLAR_LABEL_MAP[c.pillar] ?? c.pillar))];
  return `올해 기운이 내 사주의 ${areas.join(", ")}과 잘 어울려요. 이 영역에서 좋은 인연이나 기회가 자연스럽게 찾아올 수 있어요.`;
}

interface Props {
  postnatal: PostnatalResult;
}

export default function RelationshipTab({ postnatal }: Props) {
  const allClashes = [...postnatal.seun_clashes, ...postnatal.daeun_clashes];
  const allCombines = [...postnatal.seun_combines, ...postnatal.daeun_combines];
  const hasClashCombine = allClashes.length > 0 || allCombines.length > 0;

  return (
    <div className="space-y-4">
      {/* 충·합 분석 */}
      {hasClashCombine && (
        <div className="slide-card">
          <div className="slide-card__header">
            <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">올해 충·합 분석</h3>
            <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">
              올해 기운이 내 사주의 어느 자리와 작용하는지 확인하세요
            </p>
          </div>
          <div className="divider" />
          <div className="slide-card__body space-y-3">
            {allClashes.length > 0 && (
              <div className="rounded-lg px-4 py-3 text-sm leading-relaxed bg-[var(--color-ivory)]"
                style={{ borderLeft: "3px solid var(--color-fire)" }}>
                <p className="font-medium text-[var(--color-fire)] mb-1">충(衝) — 변화와 갈등</p>
                <p className="text-[var(--color-ink-light)]">{buildClashNarrative(allClashes)}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {allClashes.map((c, i) => (
                    <span key={i} className="text-xs bg-[#F7EDEC] border border-[#E0B5B1] rounded-full px-2 py-0.5 text-[var(--color-fire)]">
                      {c.incoming} → {PILLAR_LABEL_MAP[c.pillar] ?? c.pillar}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {allCombines.length > 0 && (
              <div className="rounded-lg px-4 py-3 text-sm leading-relaxed bg-[var(--color-ivory)]"
                style={{ borderLeft: "3px solid var(--color-wood)" }}>
                <p className="font-medium text-[var(--color-wood)] mb-1">합(合) — 인연과 기회</p>
                <p className="text-[var(--color-ink-light)]">{buildCombineNarrative(allCombines)}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {allCombines.map((c, i) => (
                    <span key={i} className="text-xs bg-[#EEF4F0] border border-[#C1D6C8] rounded-full px-2 py-0.5 text-[var(--color-wood)]">
                      {c.incoming} + {PILLAR_LABEL_MAP[c.pillar] ?? c.pillar} ({c.type})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 인간관계 해석 */}
      {postnatal.relationships.length > 0 ? (
        <div className="slide-card">
          <div className="slide-card__header">
            <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">인간관계 흐름</h3>
          </div>
          <div className="divider" />
          <div className="slide-card__body">
            <InterpretSection title="" blocks={postnatal.relationships} />
          </div>
        </div>
      ) : !hasClashCombine && (
        <div className="slide-card">
          <div className="slide-card__body">
            <p className="text-sm text-[var(--color-ink-muted)] text-center py-4">
              올해는 대인관계에 특별한 충·합이 없어요. 현재 관계를 꾸준히 이어가기 좋은 시기예요.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
