import type { SajuCharacter } from "@/types/analysis";
import CollapsibleSectionHeader from "@/components/CollapsibleSectionHeader";
import KkachiTip from "@/components/KkachiTip";
import { getElementInfo } from "@/lib/elementColors";

const ELEMENT_READING: Record<string, string> = { 木: "목", 火: "화", 土: "토", 金: "금", 水: "수" };

interface Props {
  character: SajuCharacter;
  name?: string;
  onNavigate?: (tab: string) => void;
}

/** 사주 캐릭터 — 일간 × 신강/신약 20유형 (백엔드 natal.character). 그림은 /kkachi/saju_character/{key}.webp */
export default function SajuCharacterCard({ character: c, name, onNavigate }: Props) {
  const el = getElementInfo(c.element);
  const pct = Math.min(100, Math.max(0, c.strength_pct));
  const tone = c.strong ? "var(--color-fire)" : "var(--color-water)";
  return (
    <div className="slide-card">
      <CollapsibleSectionHeader title="나의 사주 캐릭터">
        나를 상징하는 <strong className="text-[var(--color-ink)]">일간(日干)</strong>에, 일간의 힘이 센지 여린지를 보는{" "}
        <strong className="text-[var(--color-ink)]">신강·신약(身強·身弱)</strong>으로 뽑아본 나의 캐릭터예요.
      </CollapsibleSectionHeader>
      <div className="divider" />
      <div className="slide-card__body space-y-3">
        <KkachiTip>
          {`일간(日干) **${c.stem_korean}${ELEMENT_READING[c.element] ?? ""}(${c.stem}${c.element})**에 기운의 세기 **${c.strength_label}**을 더해 만든 ${name ? `${name}님의` : "이 사주의"} 까치 캐릭터예요.`}
        </KkachiTip>
        <img
          src={`/kkachi/saju_character/${c.key}.webp`}
          alt={c.title}
          className="w-full aspect-square rounded-xl object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "/kkachi/normal_kkachi_00.png"; }}
        />
        <div className="text-center space-y-1">
          <p className="font-heading text-xl font-bold text-[var(--color-ink)]">{c.title}</p>
          <p className="text-sm text-[var(--color-ink-muted)]">{c.line}</p>
        </div>
        <div className="grid grid-cols-2 rounded-xl border border-[var(--color-border-light)] divide-x divide-[var(--color-border-light)] text-center">
          <div className="px-2 py-2.5">
            <p className="text-[11px] font-semibold mb-1.5" style={{ color: el.color }}>선호하는 일</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {c.jobs.map((j) => (
                <span
                  key={j}
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold break-keep"
                  style={{ backgroundColor: el.bgColor, color: el.color, border: `1px solid ${el.borderColor}` }}
                >
                  {j}
                </span>
              ))}
            </div>
          </div>
          <div className="px-2 py-2.5">
            <p className="text-[11px] font-semibold mb-1.5 text-[var(--color-ink-muted)]">선호하지 않는 일</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {(c.jobs_avoid ?? []).map((j) => (
                <span
                  key={j}
                  className="rounded-full px-2.5 py-1 text-[11px] break-keep text-[var(--color-ink-muted)] bg-[var(--color-parchment)] border border-[var(--color-border-light)]"
                >
                  {j}
                </span>
              ))}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate?.("yongshin")}
          className="w-full rounded-xl border border-[var(--color-border-light)] px-3 py-2 text-left hover:bg-[var(--color-parchment)] transition-colors"
        >
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="text-[var(--color-water)]">신약(身弱)</span>
            <span className="font-semibold" style={{ color: tone }}>기운 {pct}% · {c.strength_label} ›</span>
            <span className="text-[var(--color-fire)]">신강(身強)</span>
          </div>
          <div className="relative h-2 rounded-full overflow-hidden bg-[var(--color-parchment)]">
            <div className="absolute left-1/2 top-0 h-full w-0.5 bg-[var(--color-border-light)] z-10" />
            <div
              className="absolute top-0 h-full rounded-full"
              style={{ width: `${Math.abs(pct - 50)}%`, left: pct >= 50 ? "50%" : `${pct}%`, backgroundColor: tone }}
            />
          </div>
        </button>
      </div>
    </div>
  );
}
