import type { PostnatalResult } from "@/types/analysis";
import { getElementInfo, ganjiToElements } from "@/lib/elementColors";
import DaeunTimeline from "@/components/DaeunTimeline";
import InterpretSection from "@/components/InterpretSection";

interface Props {
  postnatal: PostnatalResult;
}

export default function DaeunTab({ postnatal }: Props) {
  const currentDaeun = postnatal.daeun.find(d => d.is_current) ?? null;
  const nextDaeun = postnatal.daeun.find(d => d.start_age > (currentDaeun?.end_age ?? 0)) ?? null;

  return (
    <div className="space-y-4">
      {/* 현재 대운 상세 패널 */}
      {currentDaeun && (() => {
        const els = ganjiToElements(currentDaeun.ganji);
        const stemInfo = getElementInfo(els.stem);
        const branchInfo = getElementInfo(els.branch);
        return (
          <div className="slide-card">
            <div className="slide-card__header">
              <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">현재 나의 대운</h3>
              <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">
                {currentDaeun.start_age}~{currentDaeun.end_age}세 구간
              </p>
            </div>
            <div className="divider" />
            <div className="slide-card__body">
              <div className="flex items-start gap-5 mb-5">
                {/* 간지 */}
                <div className="flex-shrink-0 flex gap-1">
                  {[
                    { char: currentDaeun.ganji[0], info: stemInfo,   sub: "하늘" },
                    { char: currentDaeun.ganji[1], info: branchInfo, sub: "땅" },
                  ].map(({ char, info, sub }) => (
                    <div key={sub}
                      className="w-16 rounded-xl flex flex-col items-center py-3 gap-0.5"
                      style={{ backgroundColor: info.bgColor, border: `1.5px solid ${info.borderColor}` }}
                    >
                      <span className="text-[10px] text-[var(--color-ink-faint)]">{sub}</span>
                      <span className="font-heading text-3xl font-bold leading-none" style={{ color: info.color }}>{char}</span>
                      <span className="text-[11px]" style={{ color: info.color }}>{info.korean}</span>
                    </div>
                  ))}
                </div>
                {/* 대운 정보 */}
                <div className="flex-1 pt-1">
                  {currentDaeun.has_yongshin && (
                    <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full mb-3"
                      style={{ backgroundColor: "#EEF4F0", color: "var(--color-wood)", border: "1px solid #C1D6C8" }}>
                      나에게 좋은 기운의 시기
                    </span>
                  )}
                  {postnatal.daeun_sipsin.length >= 2 && (
                    <div className="grid grid-cols-2 gap-2">
                      {postnatal.daeun_sipsin.slice(0, 2).map((s, i) => (
                        <div key={i}
                          className="rounded-lg p-3 bg-[var(--color-ivory)] border border-[var(--color-border-light)] text-center">
                          <div className="text-[10px] text-[var(--color-ink-faint)] mb-0.5">{i === 0 ? "천간 십신" : "지지 십신"}</div>
                          <div className="font-heading text-lg font-bold text-[var(--color-ink)]">{s.char}</div>
                          <div className="text-xs font-medium text-[var(--color-gold)]">{s.sipsin_name}</div>
                          <div className="text-[10px] text-[var(--color-ink-faint)] mt-0.5">{s.domain}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* 다음 대운 예고 */}
              {nextDaeun && (
                <div className="flex items-center gap-3 pt-4 border-t border-[var(--color-border-light)]">
                  <span className="text-xs text-[var(--color-ink-faint)]">다음 대운</span>
                  <span className="font-heading text-base font-bold text-[var(--color-ink-muted)]">{nextDaeun.ganji}</span>
                  <span className="text-xs text-[var(--color-ink-faint)]">{nextDaeun.start_age}~{nextDaeun.end_age}세</span>
                  {nextDaeun.has_yongshin && (
                    <span className="text-xs font-medium text-[var(--color-wood)]">좋은 기운</span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* 전체 대운 흐름 타임라인 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">
            전체 흐름
            <span className="text-xs font-normal text-[var(--color-ink-faint)] ml-2">10년 주기</span>
          </h3>
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          <DaeunTimeline daeun={postnatal.daeun} />
        </div>
      </div>

      {/* 올해 세운 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">올해 세운</h3>
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          <InterpretSection title="" blocks={postnatal.annual_fortune} />
        </div>
      </div>

      {/* 인생 흐름 상세 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">인생 흐름 상세</h3>
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          <InterpretSection title="" blocks={postnatal.major_fortune} />
        </div>
      </div>
    </div>
  );
}
