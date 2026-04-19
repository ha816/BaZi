"use client";

import { useEffect, useState, Suspense } from "react";
import type { AnalysisInput, AnalysisResult, Profile } from "@/types/analysis";
import { analyzeChart, analyzeProfileChart, createProfile, listProfiles } from "@/lib/api";
import { detectLocation } from "@/lib/location";
import AnalysisForm from "@/components/AnalysisForm";
import ResultSlides from "@/components/ResultSlides";
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
  const [detectedCity, setDetectedCity] = useState<string | undefined>();
  const [detectedLongitude, setDetectedLongitude] = useState<number | undefined>();

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
      setLoading(true);
      analyzeChart(input)
        .then(setResult)
        .catch((e) => setError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다."))
        .finally(() => setLoading(false));
    }
  }, []);

  const handleSaveProfile = async (n: string, gender: "male" | "female", birth_dt: string, city: string) => {
    if (!memberId) return;
    await createProfile(memberId, { name: n, gender, birth_dt, city });
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
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !selectedProfileId) return;
    setLoading(true);
    setError(null);
    try {
      const profile = profiles.find((p) => p.id === selectedProfileId);
      const data = await analyzeProfileChart(memberId, selectedProfileId, profileYear);
      sessionStorage.setItem("kkachi_profile_input", JSON.stringify({ memberId, profileId: selectedProfileId, year: profileYear }));
      if (profile) {
        const input: AnalysisInput = { birth_dt: profile.birth_dt, gender: profile.gender, analysis_year: profileYear, city: profile.city };
        sessionStorage.setItem("kkachi_analysis_input", JSON.stringify(input));
        sessionStorage.setItem("kkachi_analysis_name", profile.name);
        setName(profile.name);
      }
      setProfileId(selectedProfileId);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (result && !loading) {
    return (
      <main className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <header className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">사주 분석</h1>
              <p className="text-sm text-[var(--color-ink-muted)]">타고난 사주와 올해의 운세를 풀어드립니다.</p>
            </div>
            <button
              onClick={() => { setResult(null); setError(null); }}
              className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors px-3 py-1.5 rounded-lg border border-[var(--color-border-light)]"
            >
              다시 입력
            </button>
          </header>
          <Suspense fallback={<LoadingSpinner />}>
            <ResultSlides data={result} name={name} memberId={memberId} profileId={profileId} />
          </Suspense>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        <header className="space-y-1">
          <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">사주 분석</h1>
          <p className="text-sm text-[var(--color-ink-muted)]">타고난 사주와 올해의 운세를 풀어드립니다.</p>
        </header>

        {/* 모드 탭 */}
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

        {/* 프로필 없음 안내 */}
        {mode === "profile" && profiles.length === 0 && (
          <div className="text-center py-10 text-sm text-[var(--color-ink-faint)] space-y-3">
            <p>{memberId ? "저장된 프로필이 없습니다." : "로그인 후 저장된 프로필을 불러올 수 있습니다."}</p>
            <a
              href={memberId ? "/profile" : "/join"}
              className="inline-block text-sm text-[var(--color-gold)] hover:opacity-70 transition-opacity"
            >
              {memberId ? "프로필 추가하기 →" : "로그인하기 →"}
            </a>
          </div>
        )}

        {/* 프로필 선택 폼 */}
        {mode === "profile" && profiles.length > 0 && (
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
                      {p.name} ({new Date(p.birth_dt).getFullYear()}년생 · {hourToSiLabel(new Date(p.birth_dt).getHours())} · {p.gender === "male" ? "남" : "여"})
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
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-ink)] text-[var(--color-ivory)] rounded-lg py-3.5 text-sm font-semibold hover:bg-[var(--color-ink-light)] disabled:bg-[var(--color-ink-faint)] transition-colors"
            >
              {loading ? "분석 중..." : "분석 시작"}
            </button>
          </form>
        )}

        {/* 직접 입력 폼 */}
        {mode === "direct" && (
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
