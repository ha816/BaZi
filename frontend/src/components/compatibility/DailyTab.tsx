import Link from "next/link";
import { useEffect, useState } from "react";
import { getDailyCompat, type DailyCompat } from "@/lib/api";
import { FORECAST_LEVEL_META, getElementInfo } from "@/lib/elementColors";
import { STEM_ELEMENT, ganjiKor } from "@/lib/ganji";
import KkachiTip from "../KkachiTip";
import LoadingSpinner from "../LoadingSpinner";
import SectionHeader from "../SectionHeader";

interface Props {
  memberId: string;
  profileId1: string;
  profileId2: string;
  name1: string;
  name2: string;
  /** 오케스트레이터가 들고 있는 결과 — 탭을 떠났다 와도 다시 부르지 않는다 */
  daily: DailyCompat | null;
  onLoaded: (d: DailyCompat) => void;
}

// 백엔드 level(좋음/보통/주의) → FORECAST_LEVEL_META 키
const LEVEL_KEY: Record<string, string> = { 좋음: "좋은 날", 보통: "평범한 날", 주의: "주의가 필요한 날" };

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });

/** 오늘의 궁합 — 오늘 일진이 두 사람의 일지·용신에 닿는지 본 점수(GET /compatibility/daily). 프로필×2일 때만 */
export default function DailyTab({ memberId, profileId1, profileId2, name1, name2, daily, onLoaded }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (daily) return;
    let alive = true;
    getDailyCompat(memberId, profileId1, profileId2)
      .then((d) => { if (alive) onLoaded(d); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [daily, memberId, profileId1, profileId2, onLoaded]);

  const el = daily ? getElementInfo(STEM_ELEMENT[daily.day_pillar[0]] ?? "") : null;
  const kor = daily ? ganjiKor(daily.day_pillar) : "";
  const meta = daily ? FORECAST_LEVEL_META[LEVEL_KEY[daily.level] ?? "평범한 날"] : null;

  return (
    <div className="slide-card">
      <div className="slide-card__header">
        <SectionHeader title="오늘의 궁합(日辰)" noMargin />
      </div>
      <div className="divider" />
      <div className="slide-card__body space-y-4">
        <KkachiTip>
          {name1}님과 {name2}님이 오늘 함께 움직이기 좋은 날인지 봤어요. 타고난 궁합과 달리, 오늘 일진(日辰)이 두 분의 일지·용신에 닿는지만 보는 점수라 매일 달라져요.
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
              </div>
              <div className="space-y-1">
                <p className="font-heading text-3xl font-bold text-[var(--color-ink)]">
                  {daily.score}<span className="text-base font-normal text-[var(--color-ink-muted)]">점</span>
                </p>
                <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${meta.badge}`}>{meta.icon} {daily.level}</span>
              </div>
            </div>

            <p className="text-base font-semibold leading-snug text-[var(--color-ink)]">{daily.headline}</p>

            <Link href="/siun" className="inline-block text-xs text-[var(--color-gold)] underline underline-offset-2">
              오늘 내 시운 자세히 보기 →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
