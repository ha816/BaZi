"use client";

import { useState } from "react";
import Link from "next/link";
import type { CompatibilityInput, CompatibilityResult, PersonInput } from "@/types/analysis";
import { analyzeCompatibility } from "@/lib/api";
import CompatibilityResultView from "@/components/CompatibilityResult";
import LoadingSpinner from "@/components/LoadingSpinner";

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

interface PersonFormState {
  name: string;
  birthDate: string;
  selectedHour: string;
  gender: "male" | "female";
}

function PersonForm({
  label,
  state,
  onChange,
  inputClass,
}: {
  label: string;
  state: PersonFormState;
  onChange: (patch: Partial<PersonFormState>) => void;
  inputClass: string;
}) {
  return (
    <div className="flex-1 bg-[var(--color-ivory-warm)] rounded-xl p-5 space-y-4 border border-[var(--color-border-light)]">
      <p className="text-xs tracking-[0.25em] text-[var(--color-gold)]">{label}</p>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--color-ink-light)]">이름</span>
        <input
          type="text"
          value={state.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="홍길동"
          className={inputClass}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--color-ink-light)]">생년월일</span>
        <input
          type="date"
          value={state.birthDate}
          onChange={(e) => onChange({ birthDate: e.target.value })}
          className={inputClass}
          min="1920-01-01"
          max="2025-12-31"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--color-ink-light)]">태어난 시간</span>
        <select
          value={state.selectedHour}
          onChange={(e) => onChange({ selectedHour: e.target.value })}
          className={`${inputClass} appearance-none`}
        >
          {HOUR_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-1.5">
        <span className="text-sm font-medium text-[var(--color-ink-light)]">성별</span>
        <div className="flex gap-2">
          {(["male", "female"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onChange({ gender: g })}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                state.gender === g
                  ? "bg-[var(--color-ink)] text-[var(--color-ivory)] shadow-sm"
                  : "bg-white text-[var(--color-ink-muted)] border border-[var(--color-border)] hover:border-[var(--color-ink-faint)]"
              }`}
            >
              {g === "male" ? "남성" : "여성"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const DEFAULT_PERSON: PersonFormState = {
  name: "",
  birthDate: "1990-01-01",
  selectedHour: "",
  gender: "male",
};

export default function CompatibilityPage() {
  const [person1, setPerson1] = useState<PersonFormState>({ ...DEFAULT_PERSON, gender: "male" });
  const [person2, setPerson2] = useState<PersonFormState>({ ...DEFAULT_PERSON, gender: "female", birthDate: "1993-01-01" });
  const [year, setYear] = useState(new Date().getFullYear());
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toPersonInput = (s: PersonFormState): PersonInput => {
    const hourOpt = HOUR_OPTIONS.find((h) => h.value === s.selectedHour);
    return {
      name: s.name || "이름 없음",
      gender: s.gender,
      birth_dt: `${s.birthDate}T${hourOpt?.time ?? "12:00"}:00`,
      city: "Seoul",
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const input: CompatibilityInput = {
        person1: toPersonInput(person1),
        person2: toPersonInput(person2),
        year,
      };
      const data = await analyzeCompatibility(input);
      setResult(data);
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
        {/* 헤더 */}
        <header className="space-y-3">
          <Link
            href="/"
            className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-gold)] transition-colors"
          >
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

        {/* 입력 폼 */}
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-light)] shadow-sm p-7 md:p-9 space-y-6"
        >
          {/* 두 사람 카드 */}
          <div className="flex flex-col md:flex-row gap-4">
            <PersonForm
              label="첫 번째 분"
              state={person1}
              onChange={(patch) => setPerson1((s) => ({ ...s, ...patch }))}
              inputClass={inputClass}
            />
            {/* 중간 하트 */}
            <div className="flex items-center justify-center flex-shrink-0 text-2xl text-[var(--color-gold-light)]">
              ♥
            </div>
            <PersonForm
              label="두 번째 분"
              state={person2}
              onChange={(patch) => setPerson2((s) => ({ ...s, ...patch }))}
              inputClass={inputClass}
            />
          </div>

          {/* 분석 연도 */}
          <div className="flex items-end gap-4">
            <label className="flex-1 space-y-1.5">
              <span className="text-sm font-medium text-[var(--color-ink-light)]">분석 연도</span>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(+e.target.value)}
                className={inputClass}
                min={1920}
                max={2100}
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-[var(--color-ink)] text-[var(--color-ivory)] rounded-lg py-2.5 text-base font-semibold hover:bg-[var(--color-ink-light)] disabled:bg-[var(--color-ink-faint)] transition-colors shadow-sm"
            >
              {loading ? "분석 중..." : "궁합 보기"}
            </button>
          </div>
        </form>

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
          <CompatibilityResultView
            data={result}
            name1={person1.name || "첫 번째 분"}
            name2={person2.name || "두 번째 분"}
          />
        )}
      </div>
    </main>
  );
}
