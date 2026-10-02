import { RELATION_TYPE_LABEL } from "@/lib/constants";
import KkachiTip from "../KkachiTip";
import SectionHeader from "../SectionHeader";
import { DOMAIN_ICONS, DOMAIN_RADAR_ORDER, DomainRadar } from "./DomainTab";
import type { CompatTabProps } from "./types";

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color =
    score >= 70 ? "var(--color-gold)" : score >= 45 ? "var(--color-earth)" : "var(--color-water)";

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="rotate-[-90deg]">
      <circle cx="70" cy="70" r={r} fill="none" strokeWidth="10" stroke="var(--color-parchment)" />
      <circle
        cx="70"
        cy="70"
        r={r}
        fill="none"
        strokeWidth="10"
        stroke={color}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
}

/** 종합 궁합 — 점수 링·라벨·설명·핵심 특징. 시간 미상 고지는 "세 기둥 기준 점수"를 말하므로 점수 옆(여기)에만 둔다 */
interface Props extends CompatTabProps {
  /** 영역 점수 아래 "영역별 해설 보기" → 영역별 탭 */
  onNavigate?: (tab: string) => void;
}

export default function TotalTab({ data, name1, name2, relationType, onNavigate }: Props) {
  const { total_score, label, description, key_traits, pillar1_snapshot, pillar2_snapshot, domain_scores } = data;
  // 카드 순서는 레이더와 같게 고정(캐시 JSONB는 키 순서를 보존하지 않음)
  const domains = DOMAIN_RADAR_ORDER.map((d) => d.label).filter((k) => domain_scores[k] != null);
  const unknown1 = !!pillar1_snapshot?.hour_unknown;
  const unknown2 = !!pillar2_snapshot?.hour_unknown;
  return (
    <div className="slide-card">
      <div className="slide-card__header">
        <SectionHeader title="종합 궁합" noMargin />
      </div>
      <div className="divider" />
      <div className="slide-card__body space-y-5">
        <KkachiTip label={`${RELATION_TYPE_LABEL[relationType]} 기준`}>
          {name1}님과 {name2}님은 {label}이에요. 탭을 하나씩 넘기며 두 분의 관계를 풀어드릴게요.
        </KkachiTip>

        <div className="flex flex-col md:flex-row items-center gap-7">
          <div className="relative flex-shrink-0">
            <ScoreRing score={total_score} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading text-4xl font-bold text-[var(--color-ink)]">
                {total_score}
              </span>
              <span className="text-xs text-[var(--color-ink-faint)]">점</span>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-3">
            <h2 className="font-heading text-2xl font-bold text-[var(--color-ink)]">{label}</h2>
            <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">{description}</p>
          </div>
        </div>

        {domains.length > 0 && (
          <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-ivory)] p-3 space-y-3">
            <p className="text-xs font-semibold text-[var(--color-ink-muted)]">영역별 점수</p>
            <DomainRadar scores={domain_scores} />
            <div className="space-y-2">
              {domains.map((k) => {
                const d = domain_scores[k];
                return (
                  <div key={k} className="flex items-center gap-2 text-xs">
                    <span className="w-24 flex-shrink-0 truncate font-semibold text-[var(--color-ink)]">
                      {DOMAIN_ICONS[k] ?? "◎"} {d.display_name ?? k}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-[var(--color-parchment)]">
                      <div className="h-2 rounded-full bg-[var(--color-gold)]" style={{ width: `${Math.max(4, Math.min(100, d.score))}%` }} />
                    </div>
                    <span className="w-8 text-right font-semibold text-[var(--color-ink)]">{d.score}</span>
                    <span className="w-9 text-right text-[10px] text-[var(--color-gold)]">{d.level}</span>
                  </div>
                );
              })}
            </div>
            {onNavigate && (
              <button type="button" onClick={() => onNavigate("domain")} className="text-xs text-[var(--color-gold)] underline underline-offset-2">
                영역별 해설 보기 →
              </button>
            )}
          </div>
        )}

        {key_traits.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {key_traits.map((t) => (
              <span key={t} className="text-[11px] px-2 py-0.5 rounded-full border border-[var(--color-gold-light)] bg-[var(--color-gold-faint)] text-[var(--color-gold)]">
                {t}
              </span>
            ))}
          </div>
        )}

        {(unknown1 || unknown2) && (
          <p className="text-[11px] text-[var(--color-ink-muted)] rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-ivory-warm)] px-3 py-2">
            🕰️ {unknown1 && unknown2 ? "두 분 모두" : unknown1 ? `${name1}님의` : `${name2}님의`} 출생시간이 없어 시주(時柱) 비교는 뺐어요. 세 기둥 기준 점수예요.
          </p>
        )}
      </div>
    </div>
  );
}
