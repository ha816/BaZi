"use client";

import { useEffect, useState } from "react";
import type { AnalysisInput, BasicResult, Profile } from "@/types/analysis";
import { getBasicChart, analyzeProfileChart, createProfile, listProfiles } from "@/lib/api";
import { detectLocation } from "@/lib/location";
import AnalysisForm from "@/components/AnalysisForm";
import FreeResultSlides from "@/components/FreeResultSlides";
import LoadingSpinner from "@/components/LoadingSpinner";

const MEMBER_ID_KEY = "kkachi_member_id";

const inputClass =
  "w-full border border-[var(--color-border)] rounded-lg px-4 py-3 text-base bg-[var(--color-card)] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold-light)] focus:outline-none transition-colors";

export default function AnalysisPage() {
  const [result, setResult] = useState<BasicResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [memberId, setMemberId] = useState<string | null>(null);
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
    const id = localStorage.getItem(MEMBER_ID_KEY);
    if (!id) return;
    setMemberId(id);
    listProfiles(id).then((ps) => {
      setProfiles(ps);
      if (ps.length > 0) {
        setMode("profile");
        setSelectedProfileId(ps[0].id);
      }
    }).catch(() => {});
  }, []);

  const handleSaveProfile = async (name: string, gender: "male" | "female", birth_dt: string, city: string) => {
    if (!memberId) return;
    await createProfile(memberId, { name, gender, birth_dt, city });
    listProfiles(memberId).then(setProfiles).catch(() => {});
  };

  const handleDirectSubmit = async (input: AnalysisInput) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBasicChart(input);
      sessionStorage.setItem("kkachi_analysis_input", JSON.stringify(input));
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
      sessionStorage.setItem("kkachi_profile_input", JSON.stringify({ memberId, profileId: selectedProfileId, year: profileYear }));
      const profile = profiles.find((p) => p.id === selectedProfileId);
      if (profile) {
        const input: AnalysisInput = {
          birth_dt: profile.birth_dt,
          gender: profile.gender,
          analysis_year: profileYear,
          city: profile.city,
        };
        const data = await getBasicChart(input);
        sessionStorage.setItem("kkachi_analysis_input", JSON.stringify(input));
        setResult(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* 헤더 */}
        <header className="space-y-1">
          <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">사주 분석</h1>
          <p className="text-sm text-[var(--color-ink-muted)]">타고난 사주와 올해의 운세를 풀어드립니다.</p>
        </header>

        {/* 탭 (프로필 있을 때) */}
        {profiles.length > 0 && (
          <div className="flex gap-1 p-1 bg-[var(--color-ivory-warm)] rounded-xl border border-[var(--color-border-light)] w-fit">
            {(["profile", "direct"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m
                    ? "bg-white text-[var(--color-ink)] shadow-sm"
                    : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                }`}
              >
                {m === "profile" ? "저장된 프로필" : "직접 입력"}
              </button>
            ))}
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
                  className={`${inputClass} appearance-none`}
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({new Date(p.birth_dt).getFullYear()}년생 · {new Date(p.birth_dt).getHours().toString().padStart(2, "0")}:{new Date(p.birth_dt).getMinutes().toString().padStart(2, "0")} · {p.gender === "male" ? "남" : "여"})
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
                  className={inputClass}
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


        {/* 결과 */}
        {result && !loading && (
          <FreeResultSlides data={result} />
        )}

      </div>
    </main>
  );
}
