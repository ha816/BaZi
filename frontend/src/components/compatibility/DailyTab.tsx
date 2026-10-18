"use client";

import { useState } from "react";
import type { DailyCompat } from "@/lib/api";
import { ELEMENT_META, FORECAST_LEVEL_META, getElementInfo } from "@/lib/elementColors";
import { STEM_ELEMENT, ganjiKor } from "@/lib/ganji";
import CollapsibleSectionHeader from "../CollapsibleSectionHeader";
import KkachiTip from "../KkachiTip";
import LoadingSpinner from "../LoadingSpinner";

interface Props {
  name1: string;
  name2: string;
  /** 오케스트레이터가 GET /compatibility/forecast로 받아 둔 오늘부터 14일 — [0]은 홈 배지와 같은 오늘 */
  forecast: DailyCompat[] | null;
  failed: boolean;
}

// 백엔드 level(좋음/보통/주의) → FORECAST_LEVEL_META 키 (시운 화면과 같은 배지·아이콘)
const LEVEL_KEY: Record<string, string> = { 좋음: "좋은 날", 보통: "평범한 날", 주의: "주의가 필요한 날" };
// 영역 막대 색 — 시운 화면 LEVEL_BAR와 같게
const LEVEL_BAR: Record<string, string> = { 좋음: "bg-emerald-400", 보통: "bg-amber-400", 주의: "bg-rose-400" };
const DOMAIN_LABELS: Record<string, string> = { 재물: "재물운", 연애: "연애운", 직업: "직업운", 건강: "건강운" };
// 일진과 일지의 관계 — 합·삼합은 초록, 충은 장미, 나머지는 먹색
const REL_TONE: Record<string, string> = {
  육합: "text-emerald-700", 삼합: "text-emerald-700", 같음: "text-[var(--color-ink-muted)]", 보통: "text-[var(--color-ink-muted)]", 충: "text-rose-700",
};
// 앞 네 날은 시운 화면과 같은 이름, 그 뒤는 날짜
const DAY_LABELS = ["오늘", "내일", "모레", "글피"];
const WEEK = 7;

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
// ganjiKor는 "을축(乙丑)" — 한자는 옆에 따로 보여 주므로 한글만
const korOf = (ganji: string) => ganjiKor(ganji).replace(/\(.*\)$/, "");
const fmtShort = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

/** 시운 — 두 사람의 궁합 시운을 시운 화면(/siun)과 같은 모양으로(GET /compatibility/forecast, 오늘부터 14일):
 *  오늘·내일·모레·글피 탭 → 일진 색 히어로(한 줄 + ✦ 함께 할 것 + ✕ 피할 것, 간지·종합 점수) → 두 분 각자의 그날 → 영역 막대 2열 →
 *  레벨·손없는 날·절기 배지 + ✦ 팁 → 주간 궁합 시운 목록(7일, 누르면 그날로) + 함께하기 좋은 날. 프로필×2일 때만.
 *  백엔드 문장은 "오늘" 기준이라 다른 날은 "오늘"을 그 날 이름으로 바꿔 보여 준다 (2026-10-18) */
export default function DailyTab({ name1, name2, forecast, failed }: Props) {
  const [idx, setIdx] = useState(0);
  const daily = forecast?.[idx] ?? null;
  const label = daily ? (DAY_LABELS[idx] ?? fmtShort(daily.date)) : "오늘";
  const relabel = (t: string) => (idx === 0 ? t : t.replace(/오늘/g, label));
  const el = daily ? getElementInfo(STEM_ELEMENT[daily.day_pillar[0]] ?? "") : null;
  const heroBg = el ? (ELEMENT_META[el.label]?.bg ?? "bg-[var(--color-ivory-warm)]") : "";
  const meta = daily ? FORECAST_LEVEL_META[LEVEL_KEY[daily.level] ?? "평범한 날"] : null;
  // 히어로의 "함께 할 것"은 첫 팁, "피할 것"은 주의 영역의 함께 문구
  const action = daily?.tips?.[0] ?? "";
  const caution = daily?.domains?.find((d) => d.level === "주의")?.label ?? "";
  const restTips = (daily?.tips ?? []).slice(1);
  const best = forecast ? forecast.map((d, i) => ({ ...d, i })).sort((a, b) => b.score - a.score || a.i - b.i).slice(0, 3) : [];

  return (
    <div className="slide-card">
      <CollapsibleSectionHeader title="시운(時運)">
        <p>그날 일진(日辰)이 두 분 각자의 일지·용신에 어떻게 닿는지로 <strong>함께 움직이기 좋은 날인가</strong>를 봐요. 타고난 궁합과 달리 매일 달라지고, 오늘부터 2주를 점수로 훑어 함께할 날을 고를 수 있어요.</p>
      </CollapsibleSectionHeader>
      <div className="divider" />
      <div className="slide-card__body space-y-4">
        <KkachiTip>
          {`${name1}님과 ${name2}님의 궁합 시운이에요. 같은 날이라도 두 분에게 닿는 기운이 다르니, 날짜를 고르고 각자의 그날을 나란히 두고 함께할 일을 골라 보세요.`}
        </KkachiTip>

        {failed ? (
          <p className="text-xs text-[var(--color-ink-faint)]">시운을 불러오지 못했어요. 잠시 후 다시 열어 보세요.</p>
        ) : !forecast || !daily || !el || !meta ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* 날짜 탭 — 시운 화면과 같은 모양 */}
            <nav className="flex p-1 bg-[var(--color-parchment)] rounded-xl border border-[var(--color-border-light)] shadow-inner">
              {forecast.slice(0, DAY_LABELS.length).map((d, i) => (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${i === idx ? "bg-white text-[var(--color-gold)] shadow-sm" : "text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"}`}
                >
                  {DAY_LABELS[i]}
                </button>
              ))}
            </nav>

            <div key={daily.date} className="rounded-2xl border border-[var(--color-border-light)] shadow-sm overflow-hidden bg-[var(--color-card)] animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* 한 줄 + 함께 할 것·피할 것 (시운 MorningBrief와 같은 틀) */}
              <div className={`px-5 pt-5 pb-4 space-y-2 ${heroBg}`}>
                <p className="font-heading text-base font-semibold leading-snug text-[var(--color-ink)] break-keep">{relabel(daily.headline)}</p>
                {action && (
                  <div className="flex gap-2 text-sm leading-snug">
                    <span className="text-[var(--color-gold)] flex-shrink-0">✦</span>
                    <p className="text-[var(--color-ink-light)] break-keep">
                      <span className="text-[10px] font-semibold text-[var(--color-ink-faint)] mr-1.5 align-middle">{label} 함께 할 것</span>
                      {relabel(action)}
                    </p>
                  </div>
                )}
                {caution && (
                  <div className="flex gap-2 text-sm leading-snug">
                    <span className="text-rose-500 flex-shrink-0">✕</span>
                    <p className="text-[var(--color-ink-light)] break-keep">
                      <span className="text-[10px] font-semibold text-[var(--color-ink-faint)] mr-1.5 align-middle">피할 것</span>
                      {relabel(caution)}
                    </p>
                  </div>
                )}
              </div>
              <div className={`px-5 py-3 flex items-center justify-between border-y border-[var(--color-border-light)] ${heroBg}`}>
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-3xl font-bold leading-none" style={{ color: el.color }}>{daily.day_pillar}</span>
                  <span className="text-sm font-semibold" style={{ color: el.color }}>{korOf(daily.day_pillar)}</span>
                  <span className="text-[10px] text-[var(--color-ink-faint)]">{fmtDate(daily.date)}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs text-[var(--color-ink-muted)]">궁합</span>
                  <span className="font-heading text-3xl font-bold leading-none text-[var(--color-ink)]">{daily.score}</span>
                </div>
              </div>

              <div className="px-5 py-5 space-y-4">
                {/* 두 분 각자의 그날 — 시운 그리드 카드 틀 */}
                {daily.persons && daily.persons.length === 2 && (
                  <div className="grid grid-cols-2 gap-2">
                    {daily.persons.map((p, i) => {
                      const m = FORECAST_LEVEL_META[p.level] ?? FORECAST_LEVEL_META["평범한 날"];
                      return (
                        <div key={i} className="rounded-xl border border-[var(--color-border-light)] px-3 py-2.5 space-y-1.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-semibold text-[var(--color-ink)] truncate">{p.name}님의 {label}</span>
                            <span className="font-heading text-lg font-bold leading-none text-[var(--color-ink)]">{p.score}<span className="text-[10px] font-normal text-[var(--color-ink-faint)] ml-0.5">{m.icon}</span></span>
                          </div>
                          <p className={`text-[11px] font-semibold leading-snug break-keep ${REL_TONE[p.relation] ?? ""}`}>{relabel(p.relation_label)}</p>
                          {p.yongshin_hit && <p className="text-[11px] font-semibold text-[var(--color-gold)]">용신 {p.yongshin} 기운이 드는 날</p>}
                          {/* 아침 한 마디 — 타일에 이름이 있으니 "○○님, " 접두는 뗀다 */}
                          <p className="text-[11px] leading-snug text-[var(--color-ink-muted)] break-keep">{relabel(p.headline.replace(/^.+?님, /, ""))}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 영역별 — 시운 화면과 같은 2열 막대. 막대는 두 사람 중 낮은 점수(함께의 수준) */}
                {!!daily.domains?.length && (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                    {daily.domains.map((d) => (
                      <div key={d.key} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-[var(--color-ink-light)]">{DOMAIN_LABELS[d.key] ?? d.key}</span>
                          <span className="font-medium text-[var(--color-ink)]">{d.score1}<span className="text-[var(--color-ink-faint)]">·</span>{d.score2}</span>
                        </div>
                        <div className="h-1.5 bg-[var(--color-ivory-warm)] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${LEVEL_BAR[d.level] ?? "bg-amber-400"}`} style={{ width: `${Math.min(d.score1, d.score2)}%` }} />
                        </div>
                        <p className="text-[10px] leading-snug text-[var(--color-ink-faint)] break-keep">{relabel(d.label)}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 배지 + 팁 — 시운 화면과 같은 틀 */}
                <div className="border-t border-[var(--color-border-light)] pt-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1 text-sm font-bold border px-3 py-1 rounded-full ${meta.color}`}>{meta.icon} {daily.level}</span>
                    {daily.son_eomneun_nal && (
                      <span className="inline-flex items-center gap-1 text-sm font-bold border px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border-indigo-200">👻 손없는 날</span>
                    )}
                    {daily.solar_term && (
                      <span className="inline-flex items-center gap-1 text-sm font-bold border px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border-emerald-200">🌱 {daily.solar_term}</span>
                    )}
                  </div>
                  {restTips.length > 0 && (
                    <ul className="space-y-1 pt-1">
                      {restTips.map((t, i) => (
                        <li key={i} className="flex gap-1.5 text-xs text-[var(--color-ink-light)]">
                          <span className="text-[var(--color-gold)] flex-shrink-0">✦</span>
                          <span className="break-keep">{relabel(t)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* 주간 궁합 시운 — 시운 화면의 주간 목록과 같은 틀, 누르면 그날로 */}
            <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm px-4 pt-4 pb-2">
              <p className="text-xs font-semibold text-[var(--color-ink-muted)] mb-1">주간 궁합 시운</p>
              {forecast.slice(0, WEEK).map((d, i) => {
                const dEl = getElementInfo(STEM_ELEMENT[d.day_pillar[0]] ?? "");
                const m = FORECAST_LEVEL_META[LEVEL_KEY[d.level] ?? "평범한 날"];
                return (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => setIdx(i)}
                    className={`w-full flex items-center justify-between gap-2 py-2.5 border-b border-[var(--color-border-light)] last:border-b-0 text-left ${i === idx ? "bg-[var(--color-ivory-warm)]/60 -mx-2 px-2 rounded-lg" : ""}`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="w-10 text-xs font-semibold text-[var(--color-ink-muted)]">{fmtShort(d.date)}</span>
                      <span className="text-[10px] text-[var(--color-ink-faint)] w-7">{DAY_LABELS[i] ?? "일월화수목금토"[new Date(`${d.date}T00:00:00`).getDay()]}</span>
                      <span className="font-heading text-sm font-bold" style={{ color: dEl.color }}>{d.day_pillar}</span>
                      <span className="text-[11px] text-[var(--color-ink-muted)]">{korOf(d.day_pillar)}</span>
                    </span>
                    <span className="flex items-baseline gap-1 flex-shrink-0">
                      <span className="text-[10px] text-[var(--color-ink-faint)]">궁합 점수</span>
                      <span className="font-heading text-base font-bold text-[var(--color-ink)]">{d.score}</span>
                      <span className="text-sm">{m.icon}</span>
                    </span>
                  </button>
                );
              })}
              {best.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-3 pb-2 text-[11px]">
                  <span className="text-[var(--color-ink-muted)]">2주 안에 함께하기 좋은 날</span>
                  {best.map((d) => (
                    <button key={d.date} type="button" onClick={() => setIdx(d.i)} className="px-2 py-0.5 rounded-full border border-[var(--color-border-light)] bg-white font-semibold text-[var(--color-ink)]">
                      {fmtShort(d.date)} {d.score}점
                    </button>
                  ))}
                </div>
              )}
            </div>

          </>
        )}
      </div>
    </div>
  );
}
