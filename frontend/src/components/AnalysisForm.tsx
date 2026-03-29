"use client";

import { useState } from "react";
import type { AnalysisInput } from "@/types/analysis";

interface Props {
  onSubmit: (input: AnalysisInput) => void;
  loading: boolean;
}

const HOUR_OPTIONS = [
  { value: "", label: "모르겠어요", time: "12:00" },
  { value: "23", label: "자시 (子) 23:00 ~ 01:00", time: "23:00" },
  { value: "01", label: "축시 (丑) 01:00 ~ 03:00", time: "01:00" },
  { value: "03", label: "인시 (寅) 03:00 ~ 05:00", time: "03:00" },
  { value: "05", label: "묘시 (卯) 05:00 ~ 07:00", time: "05:00" },
  { value: "07", label: "진시 (辰) 07:00 ~ 09:00", time: "07:00" },
  { value: "09", label: "사시 (巳) 09:00 ~ 11:00", time: "09:00" },
  { value: "11", label: "오시 (午) 11:00 ~ 13:00", time: "11:00" },
  { value: "13", label: "미시 (未) 13:00 ~ 15:00", time: "13:00" },
  { value: "15", label: "신시 (申) 15:00 ~ 17:00", time: "15:00" },
  { value: "17", label: "유시 (酉) 17:00 ~ 19:00", time: "17:00" },
  { value: "19", label: "술시 (戌) 19:00 ~ 21:00", time: "19:00" },
  { value: "21", label: "해시 (亥) 21:00 ~ 23:00", time: "21:00" },
];

export default function AnalysisForm({ onSubmit, loading }: Props) {
  const [birthDate, setBirthDate] = useState("1990-01-01");
  const [selectedHour, setSelectedHour] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [analysisYear, setAnalysisYear] = useState(new Date().getFullYear());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hourOpt = HOUR_OPTIONS.find((h) => h.value === selectedHour);
    const time = hourOpt?.time ?? "12:00";
    onSubmit({
      birth_dt: `${birthDate}T${time}:00`,
      gender,
      analysis_year: analysisYear,
    });
  };

  const inputClass =
    "w-full border border-[var(--color-border)] rounded-lg px-4 py-3 text-base bg-[var(--color-card)] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold-light)] focus:outline-none transition-colors";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-light)] shadow-sm p-7 md:p-9 space-y-7"
    >
      <div>
        <h2 className="font-heading text-xl font-semibold text-[var(--color-ink)]">
          생년월일시 입력
        </h2>
        <p className="text-sm text-[var(--color-ink-faint)] mt-1.5">
          정확한 생년월일시를 입력할수록 더 정확한 분석이 가능합니다
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink-light)]">생년월일</span>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className={inputClass}
            min="1920-01-01"
            max="2025-12-31"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink-light)]">태어난 시간</span>
          <select
            value={selectedHour}
            onChange={(e) => setSelectedHour(e.target.value)}
            className={`${inputClass} appearance-none`}
          >
            {HOUR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-[var(--color-ink-faint)]">
            모르시면 그대로 두셔도 됩니다
          </span>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink-light)]">분석 연도</span>
          <input
            type="number"
            value={analysisYear}
            onChange={(e) => setAnalysisYear(+e.target.value)}
            className={inputClass}
            min={1920}
            max={2100}
          />
          <span className="text-xs text-[var(--color-ink-faint)]">
            어느 해의 운세를 보고 싶으신가요?
          </span>
        </label>
      </div>

      {/* Gender toggle */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink-light)]">성별</span>
        <div className="flex gap-3">
          {(["male", "female"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`flex-1 py-3.5 rounded-lg text-base font-medium transition-all min-h-[48px] ${
                gender === g
                  ? "bg-[var(--color-ink)] text-[var(--color-ivory)] shadow-sm"
                  : "bg-[var(--color-ivory)] text-[var(--color-ink-muted)] border border-[var(--color-border)] hover:border-[var(--color-ink-faint)]"
              }`}
            >
              {g === "male" ? "남성" : "여성"}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[var(--color-ink)] text-[var(--color-ivory)] rounded-lg py-4 text-base font-semibold hover:bg-[var(--color-ink-light)] disabled:bg-[var(--color-ink-faint)] transition-colors min-h-[52px] shadow-sm"
      >
        {loading ? "분석 중..." : "사주 분석하기"}
      </button>
    </form>
  );
}
