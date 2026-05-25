"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { CompatibilityInput, CompatibilityResult, PersonInput, Profile, RelationType } from "@/types/analysis";
import {
  analyzeCompatibility,
  analyzeCompatibilityByProfiles,
  listProfiles,
  streamCompatibilityNarrative,
} from "@/lib/api";
import { detectLocation } from "@/lib/location";
import CompatibilityChat from "@/components/CompatibilityChat";
import CompatibilityResultView from "@/components/CompatibilityResult";
import LoadingSpinner from "@/components/LoadingSpinner";
import PersonCard, { type PersonState, DEFAULT_MANUAL } from "@/components/PersonCard";
import { MEMBER_ID_KEY, HOUR_OPTIONS } from "@/lib/constants";

export default function CompatibilityPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CompatibilityPageInner />
    </Suspense>
  );
}

function CompatibilityPageInner() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [detectedCity, setDetectedCity] = useState("Seoul");
  const [person1, setPerson1] = useState<PersonState>({ mode: "manual", manual: { ...DEFAULT_MANUAL, gender: "male" }, profileId: "" });
  const [person2, setPerson2] = useState<PersonState>({ mode: "manual", manual: { ...DEFAULT_MANUAL, gender: "female", birthDate: "1993-01-01" }, profileId: "" });
  const [year, setYear] = useState(new Date().getFullYear());
  const [relationType, setRelationType] = useState<RelationType>("lover");
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [chatInput, setChatInput] = useState<CompatibilityInput | null>(null);
  const [resultNames, setResultNames] = useState<{ name1: string; name2: string }>({ name1: "", name2: "" });
  const [narrative, setNarrative] = useState("");
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const narrativeAbortRef = useRef<AbortController | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    detectLocation().then((loc) => { if (loc) setDetectedCity(loc.city); });
  }, []);

  useEffect(() => {
    const id = localStorage.getItem(MEMBER_ID_KEY);
    if (!id) return;
    listProfiles(id).then((ps) => {
      setProfiles(ps);
      if (ps.length === 0) return;

      const p1Param = searchParams.get("p1");
      const p2Param = searchParams.get("p2");
      const selfP = ps.find((p) => p.is_self);

      const p1 = ps.find((p) => p.id === p1Param) ?? selfP ?? ps[0];
      const p2 =
        ps.find((p) => p.id === p2Param && p.id !== p1.id) ??
        ps.find((p) => p.id !== p1.id && !p.is_self) ??
        ps.find((p) => p.id !== p1.id);

      setPerson1((s) => ({ ...s, mode: "profile", profileId: p1.id }));
      if (p2) setPerson2((s) => ({ ...s, mode: "profile", profileId: p2.id }));
    }).catch(() => {});
  }, [searchParams]);

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

  const personToInput = (s: PersonState): PersonInput => {
    if (s.mode === "profile" && s.profileId) {
      const p = profiles.find((x) => x.id === s.profileId);
      if (p) return { name: p.name, gender: p.gender, birth_dt: p.birth_dt, city: p.city };
    }
    return toPersonInput(s);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    narrativeAbortRef.current?.abort();
    setLoading(true);
    setError(null);
    setResult(null);
    setChatInput(null);
    setNarrative("");
    setNarrativeLoading(false);
    try {
      const input: CompatibilityInput = {
        person1: personToInput(person1),
        person2: personToInput(person2),
        year,
        relation_type: relationType,
      };
      // 둘 다 프로필이면 /compatibility (캐시 지원), 아니면 /compatibility/direct
      const data =
        person1.mode === "profile" && person2.mode === "profile" && person1.profileId && person2.profileId
          ? await analyzeCompatibilityByProfiles(person1.profileId, person2.profileId, year, relationType)
          : await analyzeCompatibility(input);
      setResult(data);
      setChatInput(input);
      const names = {
        name1: getName(person1, "첫 번째 분"),
        name2: getName(person2, "두 번째 분"),
      };
      setResultNames(names);
      sessionStorage.setItem("kkachi_compat_input", JSON.stringify(input));
      sessionStorage.setItem("kkachi_compat_names", JSON.stringify(names));

      const controller = new AbortController();
      narrativeAbortRef.current = controller;
      setNarrativeLoading(true);
      streamCompatibilityNarrative(input, setNarrative, controller.signal)
        .catch(() => {})
        .finally(() => {
          if (narrativeAbortRef.current === controller) setNarrativeLoading(false);
        });
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => { narrativeAbortRef.current?.abort(); };
  }, []);

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

          <div className="space-y-1.5">
            <span className="text-sm font-medium text-[var(--color-ink-light)]">관계 유형</span>
            <div className="flex gap-2">
              {([
                { value: "lover",  label: "연인·부부" },
                { value: "friend", label: "친구·동료" },
                { value: "family", label: "가족" },
              ] as const).map(({ value, label }) => {
                const active = relationType === value;
                return (
                  <button key={value} type="button" onClick={() => setRelationType(value)}
                    className={`flex-1 rounded-lg py-2 text-sm border transition-colors ${
                      active
                        ? "bg-[var(--color-ink)] text-[var(--color-ivory)] border-[var(--color-ink)]"
                        : "bg-white text-[var(--color-ink-muted)] border-[var(--color-border)] hover:border-[var(--color-gold-light)]"
                    }`}>
                    {label}
                  </button>
                );
              })}
            </div>
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
            name2={getName(person2, "두 번째 분")}
            streamingNarrative={narrative}
            narrativeLoading={narrativeLoading} />
        )}
      </div>

      {result && chatInput && !loading && <CompatibilityChat />}
    </main>
  );
}
