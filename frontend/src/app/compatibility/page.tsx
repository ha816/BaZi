"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CompatibilityInput, CompatibilityResult, PersonInput, Profile } from "@/types/analysis";
import {
  analyzeCompatibility,
  analyzeCompatibilityByProfiles,
  listProfiles,
} from "@/lib/api";
import CompatibilityResultView from "@/components/CompatibilityResult";
import LoadingSpinner from "@/components/LoadingSpinner";

const MEMBER_ID_KEY = "bazi_member_id";

const HOUR_OPTIONS = [
  { value: "", label: "모르겠어요", time: "12:00" },
  { value: "23", label: "자시 (子) 23~01시", time: "23:00" },
  { value: "01", label: "축시 (丑) 01~03시", time: "01:00" },
  { value: "03", label: "인시 (寅) 03~05시", time: "03:00" },
  { value: "05", label: "묘시 (卯) 05~07시", time: "05:00" },
  { value: "07", label: "진시 (辰) 07~09시", time: "07:00" },
  { value: "09", label: "사시 (巳) 09~11시", time: "09:00" },
  { value: "11", label: "오시 (午) 11~13시", time: "11:00" },
  { value: "13", label: "미시 (未) 13~15시", time: "13:00" },
  { value: "15", label: "신시 (申) 15~17시", time: "15:00" },
  { value: "17", label: "유시 (酉) 17~19시", time: "17:00" },
  { value: "19", label: "술시 (戌) 19~21시", time: "19:00" },
  { value: "21", label: "해시 (亥) 21~23시", time: "21:00" },
];

interface ManualState {
  name: string;
  birthDate: string;
  selectedHour: string;
  gender: "male" | "female";
}

interface PersonState {
  mode: "manual" | "profile";
  manual: ManualState;
  profileId: string;
}

function PersonCard({
  label,
  state,
  profiles,
  onChange,
  inputClass,
}: {
  label: string;
  state: PersonState;
  profiles: Profile[];
  onChange: (patch: Partial<PersonState>) => void;
  inputClass: string;
}) {
  const { mode, manual, profileId } = state;

  return (
    <div className="flex-1 bg-[var(--color-ivory-warm)] rounded-xl p-5 space-y-4 border border-[var(--color-border-light)]">
      <div className="flex items-center justify-between">
        <p className="text-xs tracking-[0.25em] text-[var(--color-gold)]">{label}</p>
        {/* 모드 토글 — 저장된 프로필이 있을 때만 */}
        {profiles.length > 0 && (
          <div className="flex gap-0.5 p-0.5 bg-[var(--color-parchment)] rounded-lg">
            {(["profile", "manual"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onChange({ mode: m })}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  mode === m
                    ? "bg-white text-[var(--color-ink)] shadow-sm"
                    : "text-[var(--color-ink-faint)]"
                }`}
              >
                {m === "profile" ? "프로필" : "직접"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 프로필 선택 모드 */}
      {mode === "profile" && profiles.length > 0 && (
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[var(--color-ink-light)]">저장된 프로필</span>
          <select
            value={profileId}
            onChange={(e) => onChange({ profileId: e.target.value })}
            className={`${inputClass} appearance-none`}
          >
            <option value="">선택하세요</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({new Date(p.birth_dt).getFullYear()}년생 · {p.gender === "male" ? "남" : "여"})
              </option>
            ))}
          </select>
        </label>
      )}

      {/* 직접 입력 모드 */}
      {mode === "manual" && (
        <>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[var(--color-ink-light)]">이름</span>
            <input
              type="text"
              value={manual.name}
              onChange={(e) => onChange({ manual: { ...manual, name: e.target.value } })}
              placeholder="홍길동"
              className={inputClass}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[var(--color-ink-light)]">생년월일</span>
            <input
              type="date"
              value={manual.birthDate}
              onChange={(e) => onChange({ manual: { ...manual, birthDate: e.target.value } })}
              className={inputClass}
              min="1920-01-01"
              max="2025-12-31"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[var(--color-ink-light)]">태어난 시간</span>
            <select
              value={manual.selectedHour}
              onChange={(e) => onChange({ manual: { ...manual, selectedHour: e.target.value } })}
              className={`${inputClass} appearance-none`}
            >
              {HOUR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-[var(--color-ink-light)]">성별</span>
            <div className="flex gap-2">
              {(["male", "female"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => onChange({ manual: { ...manual, gender: g } })}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    manual.gender === g
                      ? "bg-[var(--color-ink)] text-[var(--color-ivory)]"
                      : "bg-white text-[var(--color-ink-muted)] border border-[var(--color-border)]"
                  }`}
                >
                  {g === "male" ? "남성" : "여성"}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const DEFAULT_MANUAL: ManualState = { name: "", birthDate: "1990-01-01", selectedHour: "", gender: "male" };

export default function CompatibilityPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [person1, setPerson1] = useState<PersonState>({ mode: "manual", manual: { ...DEFAULT_MANUAL, gender: "male" }, profileId: "" });
  const [person2, setPerson2] = useState<PersonState>({ mode: "manual", manual: { ...DEFAULT_MANUAL, gender: "female", birthDate: "1993-01-01" }, profileId: "" });
  const [year, setYear] = useState(new Date().getFullYear());
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      city: "Seoul",
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

  const inputClass =
    "w-full border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-sm bg-white text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold-light)] focus:outline-none transition-colors";

  return (
    <main className="min-h-screen py-10 md:py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-3">
          <Link href="/" className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-gold)] transition-colors">
            ← 사주 분석으로
          </Link>
          <div>
            <p className="text-xs tracking-[0.3em] text-[var(--color-gold)]">合宮 궁합</p>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--color-ink)] mt-1">
              사주 궁합 보기
            </h1>
            <p className="text-base text-[var(--color-ink-muted)] mt-2 leading-relaxed">
              두 분의 사주를 비교해 오행 기반 궁합을 풀어드립니다.
            </p>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-light)] shadow-sm p-7 md:p-9 space-y-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <PersonCard label="첫 번째 분" state={person1} profiles={profiles}
              onChange={(patch) => setPerson1((s) => ({ ...s, ...patch }))} inputClass={inputClass} />
            <div className="flex items-center justify-center flex-shrink-0 text-2xl text-[var(--color-gold-light)]">♥</div>
            <PersonCard label="두 번째 분" state={person2} profiles={profiles}
              onChange={(patch) => setPerson2((s) => ({ ...s, ...patch }))} inputClass={inputClass} />
          </div>

          <div className="flex items-end gap-4">
            <label className="flex-1 space-y-1.5">
              <span className="text-sm font-medium text-[var(--color-ink-light)]">분석 연도</span>
              <input type="number" value={year} onChange={(e) => setYear(+e.target.value)}
                className={inputClass} min={1920} max={2100} />
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
