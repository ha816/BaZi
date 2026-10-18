import Link from "next/link";
import type { DailyCompat } from "@/lib/api";
import { FORECAST_LEVEL_META, getElementInfo } from "@/lib/elementColors";
import { STEM_ELEMENT, ganjiKor } from "@/lib/ganji";
import CollapsibleSectionHeader from "../CollapsibleSectionHeader";
import KkachiTip from "../KkachiTip";
import LoadingSpinner from "../LoadingSpinner";

interface Props {
  name1: string;
  name2: string;
  /** 오케스트레이터가 GET /compatibility/daily로 받아 둔 값 — 홈 배지와 같은 응답 */
  daily: DailyCompat | null;
  failed: boolean;
}

// 백엔드 level(좋음/보통/주의) → FORECAST_LEVEL_META 키
const LEVEL_KEY: Record<string, string> = { 좋음: "좋은 날", 보통: "평범한 날", 주의: "주의가 필요한 날" };
// 영역 '함께' 수준 색 — 시운 영역 배지와 같은 세 톤
const DOMAIN_TONE: Record<string, string> = {
  좋음: "text-emerald-800 bg-emerald-50 border-emerald-200",
  보통: "text-amber-800 bg-amber-50 border-amber-200",
  주의: "text-rose-800 bg-rose-50 border-rose-200",
};
// 일진과 일지의 관계 — 합·삼합은 초록, 충은 장미, 나머지는 먹색
const REL_TONE: Record<string, string> = {
  육합: "text-emerald-700", 삼합: "text-emerald-700", 같음: "text-[var(--color-ink-muted)]", 보통: "text-[var(--color-ink-muted)]", 충: "text-rose-700",
};

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });

/** 오늘의 궁합 — 오늘 일진이 두 사람 각자에게 닿는 모양을 나란히 놓고 "함께 움직이기 좋은가"를 본다(GET /compatibility/daily).
 *  2026-10-18 보강: 각자의 오늘(시운과 같은 계산) 타일 · 함께하기 좋은 영역(재물·연애·직업·건강, 낮은 쪽 기준) · 팁. 프로필×2일 때만 */
export default function DailyTab({ name1, name2, daily, failed }: Props) {
  const el = daily ? getElementInfo(STEM_ELEMENT[daily.day_pillar[0]] ?? "") : null;
  const kor = daily ? ganjiKor(daily.day_pillar) : "";
  const meta = daily ? FORECAST_LEVEL_META[LEVEL_KEY[daily.level] ?? "평범한 날"] : null;

  return (
    <div className="slide-card">
      <CollapsibleSectionHeader title="오늘의 궁합(日辰)">
        <p>오늘 일진(日辰)이 두 분 각자의 일지·용신에 어떻게 닿는지로 <strong>오늘 함께 움직이기 좋은가</strong>를 봐요. 타고난 궁합과 달리 매일 달라지고, 각자의 오늘 시운을 나란히 놓고 함께하기 좋은 영역을 골라요.</p>
      </CollapsibleSectionHeader>
      <div className="divider" />
      <div className="slide-card__body space-y-4">
        <KkachiTip>
          {`${name1}님과 ${name2}님이 오늘 함께 움직이기 좋은 날인지 봤어요. 같은 날이라도 두 분에게 닿는 기운이 다르니, 각자의 오늘을 나란히 두고 함께할 일을 골라 보세요.`}
        </KkachiTip>

        {failed ? (
          <p className="text-xs text-[var(--color-ink-faint)]">오늘의 궁합을 불러오지 못했어요. 잠시 후 다시 열어 보세요.</p>
        ) : !daily || !el || !meta ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-ivory-warm)] px-5 py-3 text-center">
                <p className="text-[10px] text-[var(--color-ink-muted)] mb-1">{fmtDate(daily.date)} 일진</p>
                {[0, 1].map((i) => (
                  <p key={i} className="font-heading leading-tight whitespace-nowrap" style={{ color: el.color }}>
                    <span className="text-2xl font-bold">{kor[i] ?? ""}</span>
                    <span className="text-sm">({daily.day_pillar[i]})</span>
                  </p>
                ))}
                {daily.day_element && <p className="text-[10px] mt-1" style={{ color: el.color }}>{el.label}({daily.day_element}) 기운</p>}
              </div>
              <div className="space-y-1.5">
                <p className="font-heading text-3xl font-bold text-[var(--color-ink)]">
                  {daily.score}<span className="text-base font-normal text-[var(--color-ink-muted)]">점</span>
                </p>
                <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${meta.badge}`}>{meta.icon} {daily.level}</span>
                {(daily.solar_term || daily.son_eomneun_nal) && (
                  <div className="flex flex-wrap gap-1 text-[10px] text-[var(--color-ink-muted)]">
                    {daily.solar_term && <span className="px-1.5 py-0.5 rounded-full bg-[var(--color-ivory-warm)] border border-[var(--color-border-light)]">🌱 {daily.solar_term}</span>}
                    {daily.son_eomneun_nal && <span className="px-1.5 py-0.5 rounded-full bg-[var(--color-ivory-warm)] border border-[var(--color-border-light)]">👻 손없는 날</span>}
                  </div>
                )}
              </div>
            </div>

            <p className="text-base font-semibold leading-snug text-[var(--color-ink)] break-keep">{daily.headline}</p>

            {daily.persons && daily.persons.length === 2 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[var(--color-ink)]">두 분 각자의 오늘</p>
                <div className="grid grid-cols-2 gap-2">
                  {daily.persons.map((p, i) => {
                    const m = FORECAST_LEVEL_META[p.level] ?? FORECAST_LEVEL_META["평범한 날"];
                    return (
                      <div key={i} className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-ivory-warm)] px-3 py-2.5 space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-[var(--color-ink)] truncate">{p.name}님</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${m.badge}`}>{m.icon} {p.score}점</span>
                        </div>
                        <p className={`text-[11px] font-semibold leading-snug break-keep ${REL_TONE[p.relation] ?? ""}`}>{p.relation_label}</p>
                        {p.yongshin_hit && <p className="text-[11px] font-semibold text-[var(--color-gold)]">용신 {p.yongshin} 기운이 드는 날</p>}
                        {/* 아침 한 마디 — 타일에 이름이 있으니 "○○님, " 접두는 뗀다 */}
                        <p className="text-[11px] leading-snug text-[var(--color-ink-muted)] break-keep">{p.headline.replace(/^.+?님, /, "")}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!!daily.domains?.length && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[var(--color-ink)]">오늘 함께하기 좋은 영역</p>
                {daily.domains.map((d) => (
                  <div key={d.key} className={`rounded-lg border px-3 py-2 flex items-center gap-3 ${DOMAIN_TONE[d.level] ?? DOMAIN_TONE["보통"]}`}>
                    <span className="w-8 flex-shrink-0 text-xs font-bold">{d.key}</span>
                    <span className="flex-shrink-0 text-[10px] opacity-80 whitespace-nowrap">{name1} {d.score1} · {name2} {d.score2}</span>
                    <span className="flex-1 text-right text-[11px] font-semibold leading-snug break-keep">{d.label}</span>
                  </div>
                ))}
              </div>
            )}

            {!!daily.tips?.length && (
              <ul className="space-y-1">
                {daily.tips.map((t, i) => (
                  <li key={i} className="flex gap-1.5 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                    <span aria-hidden>💡</span>
                    <span className="break-keep">{t}</span>
                  </li>
                ))}
              </ul>
            )}

            <Link href="/siun" className="inline-block text-xs text-[var(--color-gold)] underline underline-offset-2">
              오늘 내 시운 자세히 보기 →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
