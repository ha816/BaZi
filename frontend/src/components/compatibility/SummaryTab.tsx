import type { DailyCompat } from "@/lib/api";
import SectionHeader from "../SectionHeader";
import { GroupBox } from "../SummaryCard";
import TotalTab from "./TotalTab";
import type { CompatTabProps } from "./types";

interface Props extends CompatTabProps {
  /** 프로필×2일 때만 — 오케스트레이터가 받아 둔 오늘의 궁합 (null이면 아직/실패) */
  canDaily: boolean;
  daily: DailyCompat | null;
  onNavigate: (tab: string) => void;
  revealed: boolean;
  onReveal: () => void;
}

/** 한눈에 — 맨 위 종합 궁합 카드 + 탭별 한 줄(백엔드 summary). 박스 헤더를 누르면 그 탭으로 */
export default function SummaryTab({ canDaily, daily, onNavigate, revealed, onReveal, ...props }: Props) {
  const { data, name1, name2 } = props;
  const fill = (s: string) => s.replace(/\{p1\}/g, name1).replace(/\{p2\}/g, name2);
  const rows = [
    { tab: "pillars", emoji: "🧩", label: "팔자비교(八字比較)", text: data.summary?.pillars, subs: [{ label: "오행", text: data.summary?.element }] },
    { tab: "character", emoji: "🎭", label: "성격·성질 비교", text: data.summary?.sinsal, subs: [{ label: "강약", text: data.summary?.strength }] },
    { tab: "zodiac", emoji: "🐾", label: "띠궁합(十二支)", text: data.summary?.zodiac, subs: [] },
    { tab: "domain", emoji: "📊", label: "영역별 궁합", text: data.summary?.domain, subs: [] },
  ].filter((r) => r.text);

  return (
    <div className="space-y-4">
      <TotalTab {...props} onNavigate={onNavigate} revealed={revealed} onReveal={onReveal} />

      {(rows.length > 0 || canDaily) && (
        <div className="slide-card">
          <div className="slide-card__header flex items-center justify-between">
            <SectionHeader emoji="🐦" title="한눈에" noMargin />
            <span className="text-[10px] text-[var(--color-ink-faint)]">카테고리를 누르면 자세히</span>
          </div>
          <div className="divider" />
          <div className="slide-card__body space-y-3">
            {rows.map((r) => (
              <GroupBox key={r.tab} emoji={r.emoji} label={r.label} tab={r.tab} onNavigate={onNavigate}>
                <p className="text-sm leading-snug text-[var(--color-ink)]">{fill(r.text ?? "")}</p>
                {r.subs.filter((x) => x.text).map((x) => (
                  <p key={x.label} className="mt-1.5 text-sm leading-snug text-[var(--color-ink-light)]">
                    <span className="text-[11px] font-semibold text-[var(--color-ink-faint)] mr-1.5">{x.label}</span>{fill(x.text ?? "")}
                  </p>
                ))}
              </GroupBox>
            ))}
            {canDaily && (
              <GroupBox emoji="🌅" label="오늘의 궁합(日辰)" tab="daily" onNavigate={onNavigate}>
                {daily ? (
                  <p className="text-sm leading-snug text-[var(--color-ink)]">
                    <span className="font-semibold">{daily.score}점 · {daily.level}</span> — {daily.headline}
                  </p>
                ) : (
                  <p className="text-xs text-[var(--color-ink-faint)]">오늘의 궁합을 불러오는 중이에요…</p>
                )}
              </GroupBox>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
