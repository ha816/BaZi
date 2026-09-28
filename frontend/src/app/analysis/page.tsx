"use client";

import PageHeader from "@/components/PageHeader";
import { useEffect, useState, Suspense } from "react";
import type { AnalysisInput, AnalysisResult, Profile } from "@/types/analysis";
import { analyzeChart, analyzeProfileChart, createProfile, listAnalysisYears, listProfiles } from "@/lib/api";
import { detectLocation } from "@/lib/location";
import AnalysisForm from "@/components/AnalysisForm";
import ResultSlides from "@/components/ResultSlides";
import ShareButton from "@/components/ShareButton";
import LoadingSpinner from "@/components/LoadingSpinner";
import { MEMBER_ID_KEY, INPUT_CLASS, hourToSiLabel } from "@/lib/constants";

export default function AnalysisPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [memberId, setMemberId] = useState<string | undefined>();
  const [profileId, setProfileId] = useState<string | undefined>();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [mode, setMode] = useState<"direct" | "profile">("direct");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [profileYear, setProfileYear] = useState(new Date().getFullYear());
  // 선택한 프로필에 저장된 연도별 해석 — "지난 연도 분석 다시 보기" (ROADMAP R6)
  const [cachedYears, setCachedYears] = useState<number[]>([]);
  const [detectedCity, setDetectedCity] = useState<string | undefined>();
  const [detectedLongitude, setDetectedLongitude] = useState<number | undefined>();
  // 지금 보고 있는 결과의 입력값 — 공유 카드 생성에 그대로 보낸다
  const [lastInput, setLastInput] = useState<AnalysisInput | null>(null);

  useEffect(() => {
    detectLocation().then((loc) => {
      if (loc) {
        setDetectedCity(loc.city);
        setDetectedLongitude(loc.longitude);
      }
    });
  }, []);

  useEffect(() => {
    const mid = localStorage.getItem(MEMBER_ID_KEY) ?? undefined;
    setMemberId(mid);
    if (mid) {
      listProfiles(mid).then((ps) => {
        setProfiles(ps);
        if (ps.length > 0) {
          setMode("profile");
          setSelectedProfileId(ps[0].id);
        }
      }).catch(() => {});
    }

    // sessionStorage에 이전 분석 입력이 있으면 자동 분석
    const savedName = sessionStorage.getItem("kkachi_analysis_name") ?? "";
    const profileRaw = sessionStorage.getItem("kkachi_profile_input");
    const inputRaw = sessionStorage.getItem("kkachi_analysis_input");

    if (profileRaw) {
      try {
        const parsed = JSON.parse(profileRaw);
        if (parsed.profileId) setProfileId(parsed.profileId);
      } catch { /* profileId 없이 진행 */ }
    }

    if (inputRaw) {
      let input: AnalysisInput;
      try {
        input = JSON.parse(inputRaw);
      } catch {
        return;
      }
      setName(savedName);
      setLastInput(input);
      setLoading(true);
      analyzeChart(input)
        .then(setResult)
        .catch((e) => setError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다."))
        .finally(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    if (!memberId || !selectedProfileId) { setCachedYears([]); return; }
    listAnalysisYears(memberId, selectedProfileId).then(setCachedYears).catch(() => setCachedYears([]));
  }, [memberId, selectedProfileId]);

  const handleSaveProfile = async (n: string, gender: "male" | "female", birth_dt: string, city: string, birthHourUnknown: boolean) => {
    if (!memberId) return;
    await createProfile(memberId, { name: n, gender, birth_dt, city, birth_hour_unknown: birthHourUnknown });
    listProfiles(memberId).then(setProfiles).catch(() => {});
  };

  const handleDirectSubmit = async (input: AnalysisInput, n: string) => {
    setLoading(true);
    setError(null);
    try {
      sessionStorage.setItem("kkachi_analysis_input", JSON.stringify(input));
      sessionStorage.setItem("kkachi_analysis_name", n);
      sessionStorage.removeItem("kkachi_profile_input");
      const data = await analyzeChart(input);
      setName(n);
      setProfileId(undefined);
      setLastInput(input);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const runProfileAnalysis = async (year: number) => {
    if (!memberId || !selectedProfileId) return;
    setProfileYear(year);
    setLoading(true);
    setError(null);
    try {
      const profile = profiles.find((p) => p.id === selectedProfileId);
      const data = await analyzeProfileChart(memberId, selectedProfileId, year);
      sessionStorage.setItem("kkachi_profile_input", JSON.stringify({ memberId, profileId: selectedProfileId, year }));
      setCachedYears((ys) => (ys.includes(year) ? ys : [...ys, year].sort((a, b) => b - a)));
      if (profile) {
        const input: AnalysisInput = { birth_dt: profile.birth_dt, gender: profile.gender, analysis_year: year, city: profile.city, hour_unknown: profile.birth_hour_unknown };
        sessionStorage.setItem("kkachi_analysis_input", JSON.stringify(input));
        sessionStorage.setItem("kkachi_analysis_name", profile.name);
        setName(profile.name);
        setLastInput(input);
      }
      setProfileId(selectedProfileId);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runProfileAnalysis(profileYear);
  };

  const otherYears = cachedYears.filter((y) => y !== profileYear);

  if (result && !loading) {
    return (
      <main className="page page--center">
        <div className="page__inner">
          <PageHeader
            title="사주 분석"
            description="타고난 사주와 올해의 운세를 풀어드립니다."
            actions={
              <>
                {lastInput && <ShareButton input={lastInput} name={name} />}
                <button
                  onClick={() => { setResult(null); setError(null); }}
                  className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors px-3 py-1.5 rounded-lg border border-[var(--color-border-light)]"
                >
                  다시 입력
                </button>
              </>
            }
          />
          {profileId && otherYears.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[var(--color-ink-faint)]">지난 연도 다시 보기</span>
              {otherYears.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => runProfileAnalysis(y)}
                  className="px-3 py-1 rounded-full border border-[var(--color-border-light)] text-[var(--color-ink-muted)] hover:text-[var(--color-gold)] hover:border-[var(--color-gold)] transition-colors"
                >
                  {y}년
                </button>
              ))}
              <span className="px-3 py-1 rounded-full bg-[var(--color-gold-light)]/20 text-[var(--color-gold)] font-semibold">{profileYear}년 보는 중</span>
            </div>
          )}
          <Suspense fallback={<LoadingSpinner />}>
            <ResultSlides data={result} name={name} memberId={memberId} profileId={profileId} />
          </Suspense>
        </div>
      </main>
    );
  }

  return (
    <main className="page page--center">
      <div className="page__inner">

        <PageHeader title="사주 분석" description="타고난 사주와 올해의 운세를 풀어드립니다." />

        {/* 모드 탭 — 로그인했을 때만. 비로그인은 직접 입력 하나 (로그인 정책: CLAUDE.md) */}
        {memberId && (
          <div className="flex gap-1 p-1 bg-[var(--color-ivory-warm)] rounded-xl border border-[var(--color-border-light)]">
            {(["profile", "direct"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m
                    ? "bg-white text-[var(--color-ink)] shadow-sm"
                    : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                }`}
              >
                {m === "profile" ? "저장된 프로필 불러오기" : "프로필 직접 입력하기"}
              </button>
            ))}
          </div>
        )}

        {/* 프로필 없음 안내 */}
        {memberId && mode === "profile" && profiles.length === 0 && (
          <div className="text-center py-10 text-sm text-[var(--color-ink-faint)] space-y-3">
            <p>저장된 프로필이 없습니다.</p>
            <a href="/profile" className="inline-block text-sm text-[var(--color-gold)] hover:opacity-70 transition-opacity">
              프로필 추가하기 →
            </a>
          </div>
        )}

        {/* 프로필 선택 폼 */}
        {memberId && mode === "profile" && profiles.length > 0 && (
          <form
            onSubmit={handleProfileSubmit}
            className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-light)] shadow-sm p-5 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="sm:col-span-2 space-y-1.5">
                <span className="text-sm font-medium text-[var(--color-ink-light)]">프로필</span>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className={`${INPUT_CLASS} appearance-none`}
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({new Date(p.birth_dt).getFullYear()}년생 · {p.birth_hour_unknown ? "시간 모름" : hourToSiLabel(new Date(p.birth_dt).getHours())} · {p.gender === "male" ? "남" : "여"})
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-[var(--color-ink-light)]">분석 연도</span>
                <input
                  type="number"
                  value={profileYear}
                  onChange={(e) => setProfileYear(+e.target.value)}
                  className={INPUT_CLASS}
                  min={1920}
                  max={2100}
                />
              </label>
            </div>
            {otherYears.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[var(--color-ink-faint)]">저장된 지난 분석</span>
                {otherYears.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => runProfileAnalysis(y)}
                    className="px-3 py-1 rounded-full border border-[var(--color-border-light)] text-[var(--color-ink-muted)] hover:text-[var(--color-gold)] hover:border-[var(--color-gold)] transition-colors"
                  >
                    {y}년 다시 보기
                  </button>
                ))}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-ink)] text-[var(--color-ivory)] rounded-lg py-3.5 text-sm font-semibold hover:bg-[var(--color-ink-light)] disabled:bg-[var(--color-ink-faint)] transition-colors"
            >
              {loading ? "분석 중..." : "분석 시작"}
            </button>
          </form>
        )}

        {/* 직접 입력 폼 — 비로그인은 항상 이것 */}
        {(!memberId || mode === "direct") && (
          <AnalysisForm
            onSubmit={handleDirectSubmit}
            loading={loading}
            defaultCity={detectedCity}
            defaultLongitude={detectedLongitude}
            onSave={memberId ? handleSaveProfile : undefined}
          />
        )}

        {loading && <LoadingSpinner />}

        {error && (
          <div
            className="rounded-lg px-5 py-4 text-sm text-[var(--color-fire)]"
            style={{ backgroundColor: "#F7EDEC", borderLeft: "3px solid var(--color-fire)" }}
          >
            {error}
          </div>
        )}

      </div>
    </main>
  );
}
