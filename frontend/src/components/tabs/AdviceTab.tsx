import type { PostnatalResult } from "@/types/analysis";
import InterpretSection from "@/components/InterpretSection";

interface Props {
  postnatal: PostnatalResult;
}

export default function AdviceTab({ postnatal }: Props) {
  return (
    <div className="space-y-4">
      {/* 종합 조언 및 개운법 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">종합 조언 및 개운법</h3>
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          <InterpretSection title="" blocks={postnatal.advice} variant="success" />
        </div>
      </div>

      {/* 도움이 되는 기운 · 용신 */}
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
