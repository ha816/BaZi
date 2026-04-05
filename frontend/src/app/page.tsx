"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AnalysisInput, AnalysisResult, DailyFortune, Profile } from "@/types/analysis";
import { analyzeChart, getForecast, listProfiles } from "@/lib/api";
import { detectLocation } from "@/lib/location";
import AnalysisForm from "@/components/AnalysisForm";
import ResultSlides from "@/components/ResultSlides";
import LoadingSpinner from "@/components/LoadingSpinner";
import DailyFortunePanel from "@/components/DailyFortune";

const MEMBER_ID_KEY = "bazi_member_id";

const LEVEL_META: Record<string, { color: string; icon: string }> = {
  "좋은 날":         { color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: "🌟" },
  "평범한 날":       { color: "text-amber-700 bg-amber-50 border-amber-200",       icon: "☁️" },
  "주의가 필요한 날": { color: "text-rose-700 bg-rose-50 border-rose-200",          icon: "⚠️" },
};

// ── 대시보드 프로필 카드 ────────────────────────────────────────────────────
function ProfileFortuneCard({
  profile,
  memberId,
}: {
  profile: Profile;
  memberId: string;
}) {
  const [forecast, setForecast] = useState<DailyFortune[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    getForecast(memberId, profile.id, 7)
      .then(setForecast)
      .finally(() => setLoading(false));
  }, [memberId, profile.id]);

  const today = forecast?.[0];
  const meta = today ? LEVEL_META[today.level] ?? LEVEL_META["평범한 날"] : null;

  return (
    <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-light)] shadow-sm overflow-hidden">
      {/* 카드 헤더 */}
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <p className="font-heading text-lg font-semibold text-[var(--color-ink)]">{profile.name}</p>
          <p className="text-sm text-[var(--color-ink-faint)]">
            {new Date(profile.birth_dt).getFullYear()}년생 · {profile.gender === "male" ? "남" : "여"} · {profile.city}
          </p>
        </div>
        {loading && (
          <div className="w-5 h-5 rounded-full border-2 border-[var(--color-gold-light)] border-t-transparent animate-spin flex-shrink-0 mt-1" />
        )}
        {today && meta && !loading && (
          <div className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border ${meta.color}`}>
            <span>{meta.icon}</span>
            <span>{today.total_score}점</span>
          </div>
        )}
      </div>

      {/* 오늘 일진 + 날씨 요약 */}
      {today && !loading && (
        <div className="px-5 pb-4 flex items-center gap-3">
          <span className="font-heading text-2xl text-[var(--color-ink-muted)]">{today.day_pillar}</span>
          <span className="text-xs text-[var(--color-ink-faint)]">{today.day_element} · {today.level}</span>
          {today.weather && (
            <span className="text-xs text-[var(--color-ink-faint)]">| {today.weather.condition}</span>
          )}
        </div>
      )}

      {/* 운세 상세 토글 */}
      {forecast && (
        <div className="border-t border-[var(--color-border-light)]">
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-full px-5 py-3 text-left text-xs font-medium text-[var(--color-gold)] hover:bg-[var(--color-ivory-warm)] transition-colors flex items-center justify-between"
          >
            <span>오늘/내일/주간 운세</span>
            <span className="text-[var(--color-ink-faint)]">{open ? "▲" : "▼"}</span>
          </button>
          {open && (
            <div className="px-5 pb-5">
              <DailyFortunePanel forecast={forecast} loading={false} />
            </div>
          )}
        </div>
      )}

      {/* 빠른 이동 */}
      <div className="border-t border-[var(--color-border-light)] px-5 py-3 flex gap-3">
        <Link
          href={`/analysis?profileId=${profile.id}`}
          className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-gold)] transition-colors"
        >
          사주 분석 →
        </Link>
        <Link
          href={`/compatibility?profileId=${profile.id}`}
          className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-gold)] transition-colors"
        >
          궁합 보기 →
        </Link>
      </div>
    </div>
  );
}

// ── 대시보드 (로그인) ───────────────────────────────────────────────────────
function Dashboard({ memberId }: { memberId: string }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    listProfiles(memberId).then(setProfiles).catch(() => {});
  }, [memberId]);

  const today = new Date();
  const dateLabel = today.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });

  return (
    <main className="min-h-screen py-10 md:py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-end justify-between">
          <div className="space-y-1">
            <p className="text-xs tracking-[0.3em] text-[var(--color-gold)]">오늘의 운세</p>
            <h1 className="font-heading text-3xl font-bold text-[var(--color-ink)]">{dateLabel}</h1>
          </div>
          <nav className="flex gap-4 text-sm">
            <Link href="/analysis" className="text-[var(--color-ink-muted)] hover:text-[var(--color-gold)] transition-colors">
              사주 분석
            </Link>
            <Link href="/compatibility" className="text-[var(--color-ink-muted)] hover:text-[var(--color-gold)] transition-colors">
              궁합
            </Link>
            <Link href="/my" className="text-[var(--color-ink-muted)] hover:text-[var(--color-gold)] transition-colors">
              프로필
            </Link>
          </nav>
        </header>

        {profiles.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-[var(--color-ink-faint)]">저장된 프로필이 없습니다.</p>
            <Link
              href="/my"
              className="inline-block px-6 py-3 bg-[var(--color-ink)] text-[var(--color-ivory)] rounded-lg text-sm font-medium hover:bg-[var(--color-ink-light)] transition-colors"
            >
              프로필 추가하기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {profiles.map((p) => (
              <ProfileFortuneCard key={p.id} profile={p} memberId={memberId} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// ── 랜딩 (비로그인) ─────────────────────────────────────────────────────────
function Landing() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedCity, setDetectedCity] = useState<string | undefined>();

  useEffect(() => {
    detectLocation().then((loc) => { if (loc) setDetectedCity(loc.city); });
  }, []);

  const handleSubmit = async (input: AnalysisInput) => {
    setLoading(true);
    setError(null);
    try {
      setResult(await analyzeChart(input));
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen py-10 md:py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* 히어로 */}
        <header className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="flex-shrink-0">
            <img
              src="/counselor.png"
              alt="명리 상담사"
              className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-2 border-[var(--color-border-light)] shadow-md"
            />
          </div>
          <div className="text-center md:text-left space-y-3 flex-1">
            <p className="text-xs tracking-[0.3em] text-[var(--color-gold)]">命理相談</p>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--color-ink)] tracking-tight">
              사주명리 상담
            </h1>
            <p className="text-base text-[var(--color-ink-muted)] leading-relaxed">
              생년월일시를 알려주시면 타고난 기운과 올해의 운세를 풀어드릴게요.
            </p>
            <Link
              href="/my"
              className="inline-block text-sm px-4 py-2 rounded-lg border border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-white transition-colors"
            >
              로그인 · 회원가입
            </Link>
          </div>
        </header>

        <AnalysisForm onSubmit={handleSubmit} loading={loading} defaultCity={detectedCity} />

        {loading && <LoadingSpinner />}

        {error && (
          <div
            className="rounded-lg px-5 py-4 text-base text-[var(--color-fire)]"
            style={{ backgroundColor: "#F7EDEC", borderLeft: "3px solid var(--color-fire)" }}
          >
            {error}
          </div>
        )}

        {result && !loading && (
          <>
            <ResultSlides data={result} />
            <div className="text-center py-6 border-t border-[var(--color-border-light)]">
              <p className="text-sm text-[var(--color-ink-faint)] mb-3">
                프로필을 저장하면 매일 오늘의 운세를 받아볼 수 있어요.
              </p>
              <Link
                href="/my"
                className="inline-block px-6 py-3 bg-[var(--color-ink)] text-[var(--color-ivory)] rounded-lg text-sm font-medium hover:bg-[var(--color-ink-light)] transition-colors"
              >
                프로필 저장하고 매일 운세 받기 →
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

// ── 루트 ────────────────────────────────────────────────────────────────────
export default function Home() {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMemberId(localStorage.getItem(MEMBER_ID_KEY));
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return memberId ? <Dashboard memberId={memberId} /> : <Landing />;
}
