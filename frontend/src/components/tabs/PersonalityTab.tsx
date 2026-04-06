import type { NatalResult } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";
import InterpretSection from "@/components/InterpretSection";

const YANG_STEMS = new Set(["甲", "丙", "戊", "庚", "壬"]);
const STRENGTH_MAX = 8;

interface Props {
  natal: NatalResult;
}

export default function PersonalityTab({ natal }: Props) {
  const meInfo = getElementInfo(natal.my_element.name);
  const dayStemYang = YANG_STEMS.has(natal.day_stem);
  const isStrong = natal.strength_value >= 0;
  const strengthPct = Math.min(100, Math.max(0, 50 + (natal.strength_value / STRENGTH_MAX) * 50));
  const strengthColor = isStrong ? "var(--color-fire)" : "var(--color-water)";

  return (
    <div className="space-y-4">
      {/* 일간 프로파일 + 강약 게이지 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">나를 나타내는 기운</h3>
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          <div className="flex items-start gap-5">
            {/* 일간 한자 */}
            <div
              className="flex-shrink-0 w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-0.5"
              style={{ backgroundColor: meInfo.bgColor, border: `1.5px solid ${meInfo.borderColor}` }}
            >
              <span className="font-heading text-4xl font-bold leading-none" style={{ color: meInfo.color }}>
                {natal.day_stem}
              </span>
              <span className="text-[11px] font-medium" style={{ color: meInfo.color }}>
                {meInfo.korean}({meInfo.label})
              </span>
            </div>
            {/* 프로파일 */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-heading text-lg font-bold text-[var(--color-ink)]">
                  {meInfo.korean}({meInfo.label})
                </span>
                <span className="text-xs text-[var(--color-ink-faint)]">
                  {dayStemYang ? "양(陽)" : "음(陰)"}
                </span>
              </div>
              <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">{meInfo.meaning}</p>

              {/* 강약 게이지 */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-[var(--color-ink-faint)] mb-1.5">
                  <span>신약(身弱)</span>
                  <span className="font-semibold" style={{ color: strengthColor }}>{natal.strength_label}</span>
                  <span>신강(身強)</span>
                </div>
                <div className="relative h-2.5 rounded-full overflow-hidden bg-[var(--color-parchment)]">
                  <div className="absolute left-1/2 top-0 h-full w-0.5 bg-[var(--color-border-light)] z-10" />
                  <div
                    className="absolute top-0 h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.abs(strengthPct - 50)}%`,
                      left: strengthPct >= 50 ? "50%" : `${strengthPct}%`,
                      backgroundColor: strengthColor,
                    }}
                  />
                </div>
                <p className="text-xs text-[var(--color-ink-faint)] mt-1.5">
                  {isStrong
                    ? "일간의 기운이 강한 편이에요. 절제하고 남을 배려하는 쪽에서 균형을 찾아요."
                    : "일간의 기운이 약한 편이에요. 지원해주는 기운이 오면 더 잘 발휘돼요."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 성격과 기질 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">성격과 기질</h3>
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          <InterpretSection title="" blocks={natal.personality} />
        </div>
      </div>

      {/* 오행 균형 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">오행 균형</h3>
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          <InterpretSection title="" blocks={natal.element_balance} />
        </div>
      </div>
    </div>
  );
}
