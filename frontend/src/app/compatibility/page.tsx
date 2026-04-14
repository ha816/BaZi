"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CompatibilityInput, CompatibilityResult, PersonInput, Profile } from "@/types/analysis";
import {
  analyzeCompatibility,
  analyzeCompatibilityByProfiles,
  listProfiles,
  preparePayment,
} from "@/lib/api";
import { detectLocation } from "@/lib/location";
import CompatibilityResultView from "@/components/CompatibilityResult";
import LoadingSpinner from "@/components/LoadingSpinner";
import PersonCard, { type PersonState, DEFAULT_MANUAL } from "@/components/PersonCard";
import { MEMBER_ID_KEY, HOUR_OPTIONS } from "@/lib/constants";

export default function CompatibilityPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [detectedCity, setDetectedCity] = useState("Seoul");
  const [person1, setPerson1] = useState<PersonState>({ mode: "manual", manual: { ...DEFAULT_MANUAL, gender: "male" }, profileId: "" });
  const [person2, setPerson2] = useState<PersonState>({ mode: "manual", manual: { ...DEFAULT_MANUAL, gender: "female", birthDate: "1993-01-01" }, profileId: "" });
  const [year, setYear] = useState(new Date().getFullYear());
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setPerson1((s) => ({ ...s, mode: "profile", profileId: ps[0].id }));
        if (ps.length > 1) setPerson2((s) => ({ ...s, mode: "profile", profileId: ps[1].id }));
      }
    }).catch(() => {});
  }, []);

  const toPersonInput = (s: PersonState): PersonInput => {
    const hourOpt = HOUR_OPTIONS.find((h) => h.value === s.manual.selectedHour);
    return {
      name: s.manual.name || "이름 없음",
      gender: s.manual.gender,
      birth_dt: `${s.manual.birthDate}T${hourOpt?.time ?? "12:00"}:00`,
      city: s.manual.city || detectedCity,
    };
  };

  const getName = (s: PersonState, fallback: string) => {
    if (s.mode === "profile") {
      const p = profiles.find((x) => x.id === s.profileId);
      return p?.name ?? fallback;
    }
    return s.manual.name || fallback;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const credit = sessionStorage.getItem("kkachi_credit_compatibility");
    if (!credit) {
      const mid = localStorage.getItem(MEMBER_ID_KEY);
      if (!mid) {
        router.push("/join");
        return;
      }
      try {
        const { order_id, amount, feature_type, order_name } = await preparePayment({
          member_id: mid,
          feature_type: "compatibility",
        });
        router.push(
          `/payment/checkout?order_id=${order_id}&amount=${amount}&feature_type=${feature_type}&order_name=${encodeURIComponent(order_name)}`
        );
      } catch {
        router.push("/join");
      }
      return;
    }
    sessionStorage.removeItem("kkachi_credit_compatibility");

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // 둘 다 프로필이면 /compatibility (캐시 지원), 아니면 /compatibility/direct
      if (person1.mode === "profile" && person2.mode === "profile" && person1.profileId && person2.profileId) {
        setResult(await analyzeCompatibilityByProfiles(person1.profileId, person2.profileId, year));
      } else {
        const input: CompatibilityInput = {
          person1: person1.mode === "profile" && person1.profileId
            ? (() => { const p = profiles.find((x) => x.id === person1.profileId)!; return { name: p.name, gender: p.gender, birth_dt: p.birth_dt, city: p.city }; })()
            : toPersonInput(person1),
          person2: person2.mode === "profile" && person2.profileId
            ? (() => { const p = profiles.find((x) => x.id === person2.profileId)!; return { name: p.name, gender: p.gender, birth_dt: p.birth_dt, city: p.city }; })()
            : toPersonInput(person2),
          year,
        };
        setResult(await analyzeCompatibility(input));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.");
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
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--color-ink)]">
              사주 궁합 보기
            </h1>
            <p className="text-base text-[var(--color-ink-muted)] mt-2 leading-relaxed">
              까치가 놓은 오작교처럼, 두 분의 인연을 풀어드립니다.
            </p>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-light)] shadow-sm p-7 md:p-9 space-y-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <PersonCard label="첫 번째 분" state={person1} profiles={profiles}
              onChange={(patch) => setPerson1((s) => ({ ...s, ...patch }))} />
            <div className="flex items-center justify-center flex-shrink-0 text-2xl text-[var(--color-gold-light)]">♥</div>
            <PersonCard label="두 번째 분" state={person2} profiles={profiles}
              onChange={(patch) => setPerson2((s) => ({ ...s, ...patch }))} />
          </div>

          <div className="flex items-end gap-4">
            <label className="flex-1 space-y-1.5">
              <span className="text-sm font-medium text-[var(--color-ink-light)]">분석 연도</span>
              <input type="number" value={year} onChange={(e) => setYear(+e.target.value)}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-sm bg-white text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold-light)] focus:outline-none transition-colors" min={1920} max={2100} />
            </label>
            <button type="submit" disabled={loading}
              className="flex-[2] bg-[var(--color-ink)] text-[var(--color-ivory)] rounded-lg py-2.5 text-base font-semibold hover:bg-[var(--color-ink-light)] disabled:bg-[var(--color-ink-faint)] transition-colors shadow-sm">
              {loading ? "분석 중..." : "궁합 보기"}
            </button>
          </div>
        </form>

        {loading && <LoadingSpinner />}

        {error && (
          <div className="rounded-lg px-5 py-4 text-base text-[var(--color-fire)]"
            style={{ backgroundColor: "#F7EDEC", borderLeft: "3px solid var(--color-fire)" }}>
            {error}
          </div>
        )}

        {result && !loading && (
          <CompatibilityResultView data={result}
            name1={getName(person1, "첫 번째 분")}
            name2={getName(person2, "두 번째 분")} />
        )}
      </div>
    </main>
  );
}
