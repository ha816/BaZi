"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AnalysisInput, AnalysisResult, Profile } from "@/types/analysis";
import { analyzeChart, analyzeProfileChart, listProfiles } from "@/lib/api";
import { detectLocation } from "@/lib/location";
import AnalysisForm from "@/components/AnalysisForm";
import ResultSlides from "@/components/ResultSlides";
import LoadingSpinner from "@/components/LoadingSpinner";

const MEMBER_ID_KEY = "bazi_member_id";

const inputClass =
  "w-full border border-[var(--color-border)] rounded-lg px-4 py-3 text-base bg-[var(--color-card)] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold-light)] focus:outline-none transition-colors";

export default function AnalysisPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [mode, setMode] = useState<"direct" | "profile">("direct");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [profileYear, setProfileYear] = useState(new Date().getFullYear());
  const [detectedCity, setDetectedCity] = useState<string | undefined>();

  useEffect(() => {
    detectLocation().then((loc) => { if (loc) setDetectedCity(loc.city); });
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

  const handleDirectSubmit = async (input: AnalysisInput) => {
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

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !selectedProfileId) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await analyzeProfileChart(memberId, selectedProfileId, profileYear));
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen py-10 md:py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-3">
          <Link href="/" className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-gold)] transition-colors">
            ← 홈으로
          </Link>
          <div>
            <p className="text-xs tracking-[0.3em] text-[var(--color-gold)]">命理分析</p>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--color-ink)] mt-1">
              사주 분석
            </h1>
            <p className="text-base text-[var(--color-ink-muted)] mt-2">
              타고난 사주와 올해의 운세를 풀어드립니다.
            </p>
          </div>
        </header>

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

        {mode === "profile" && profiles.length > 0 && (
          <form
            onSubmit={handleProfileSubmit}
            className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-light)] shadow-sm p-7 md:p-9 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <label className="md:col-span-2 space-y-2">
                <span className="text-sm font-medium text-[var(--color-ink-light)]">프로필</span>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className={`${inputClass} appearance-none`}
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({new Date(p.birth_dt).getFullYear()}년생 · {p.gender === "male" ? "남" : "여"})
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
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
              className="w-full bg-[var(--color-ink)] text-[var(--color-ivory)] rounded-lg py-4 text-base font-semibold hover:bg-[var(--color-ink-light)] disabled:bg-[var(--color-ink-faint)] transition-colors shadow-sm"
            >
              {loading ? "분석 중..." : "사주 분석하기"}
            </button>
          </form>
        )}

        {mode === "direct" && (
          <AnalysisForm onSubmit={handleDirectSubmit} loading={loading} defaultCity={detectedCity} />
        )}

        {loading && <LoadingSpinner />}

        {error && (
          <div
            className="rounded-lg px-5 py-4 text-base text-[var(--color-fire)]"
            style={{ backgroundColor: "#F7EDEC", borderLeft: "3px solid var(--color-fire)" }}
          >
            {error}
          </div>
        )}

        {result && !loading && <ResultSlides data={result} />}
      </div>
    </main>
  );
}
