"use client";

import { useState } from "react";
import type { AnalysisInput } from "@/types/analysis";

interface Props {
  onSubmit: (input: AnalysisInput, name: string) => void;
  onSave?: (name: string, gender: "male" | "female", birth_dt: string, city: string) => Promise<void>;
  loading: boolean;
  defaultCity?: string;
  defaultLongitude?: number;
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

export default function AnalysisForm({ onSubmit, onSave, loading, defaultCity, defaultLongitude }: Props) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("1990-01-01");
  const [selectedHour, setSelectedHour] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [analysisYear, setAnalysisYear] = useState(new Date().getFullYear());
  const [longitude, setLongitude] = useState<string>(
    defaultLongitude != null ? String(defaultLongitude) : ""
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // defaultLongitude가 비동기로 들어올 때 반영
  if (defaultLongitude != null && longitude === "") {
    setLongitude(String(defaultLongitude));
  }

  const isReady = name.trim() !== "";

  const handleNameChange = (v: string) => { setName(v); setSaved(false); };
  const handleBirthDateChange = (v: string) => { setBirthDate(v); setSaved(false); };
  const handleGenderChange = (v: "male" | "female") => { setGender(v); setSaved(false); };

  const handleSave = async () => {
    if (onSave) {
      setSaving(true);
      try {
        const hourOpt = HOUR_OPTIONS.find((h) => h.value === selectedHour);
        const time = hourOpt?.time ?? "12:00";
        await onSave(name.trim(), gender, `${birthDate}T${time}:00`, defaultCity ?? "Seoul");
      } finally {
        setSaving(false);
      }
    }
    setSaved(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saved) return;
    const hourOpt = HOUR_OPTIONS.find((h) => h.value === selectedHour);
    const time = hourOpt?.time ?? "12:00";
    const lon = longitude !== "" ? parseFloat(longitude) : undefined;
    onSubmit({
      birth_dt: `${birthDate}T${time}:00`,
      gender,
      analysis_year: analysisYear,
      city: defaultCity ?? "Seoul",
      longitude: lon,
    }, name);
  };

  const inputClass =
    "w-full border border-[var(--color-border)] rounded-lg px-4 py-3 text-base bg-[var(--color-card)] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold-light)] focus:outline-none transition-colors";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-light)] shadow-sm p-7 md:p-9 space-y-7"
    >
      {/* Row 1: 이름 + 성별 */}
      <div className="flex gap-4">
        <label className="flex-1 space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink-light)]">이름 <span className="text-red-500">*</span></span>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="홍길동"
            className={inputClass}
          />
        </label>
        <div className="space-y-2 w-36">
          <span className="text-sm font-medium text-[var(--color-ink-light)]">성별 <span className="text-red-500">*</span></span>
          <div className="flex gap-2 h-[50px]">
            {(["male", "female"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => handleGenderChange(g)}
                className={`flex-1 rounded-lg text-sm font-medium transition-all ${
                  g === "male"
                    ? gender === "male"
                      ? "bg-blue-100 text-blue-600 border border-blue-300"
                      : "bg-[var(--color-ivory)] text-[var(--color-ink-faint)] border border-[var(--color-border)]"
                    : gender === "female"
                      ? "bg-pink-100 text-pink-500 border border-pink-300"
                      : "bg-[var(--color-ivory)] text-[var(--color-ink-faint)] border border-[var(--color-border)]"
                }`}
              >
                {g === "male" ? "남" : "여"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: 생년월일 + 시간 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink-light)]">생년월일 <span className="text-red-500">*</span></span>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => handleBirthDateChange(e.target.value)}
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
        </label>
      </div>

      {/* 고급 설정 토글 */}
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-ink-light)] transition-colors"
      >
        <span className={`transition-transform ${showAdvanced ? "rotate-90" : ""}`}>▶</span>
        정밀 설정
      </button>

      {/* 정밀 설정: 분석 연도 */}
      {showAdvanced && (
        <div className="pt-1">
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--color-ink-light)]">분석 연도 <span className="text-red-500">*</span></span>
            <input
              type="number"
              value={analysisYear}
              onChange={(e) => setAnalysisYear(+e.target.value)}
              className={inputClass}
              min={1920}
              max={2100}
            />
          </label>
        </div>
      )}

      <div className="flex gap-3">
        <span
          className="flex-1"
          title={!isReady ? "이름을 입력해 주세요" : undefined}
        >
          <button
            type="button"
            disabled={!isReady || saved}
            onClick={handleSave}
            className="w-full border border-[var(--color-border)] rounded-lg py-4 text-base font-semibold transition-colors min-h-[52px]
              disabled:text-[var(--color-ink-faint)] disabled:border-[var(--color-border-light)] disabled:cursor-not-allowed
              enabled:text-[var(--color-ink)] enabled:hover:bg-[var(--color-ivory-warm)]
              data-[saved=true]:text-emerald-600 data-[saved=true]:border-emerald-300 data-[saved=true]:bg-emerald-50"
            data-saved={saved}
          >
            {saved ? "✓ 저장됨" : "프로필 저장"}
          </button>
        </span>
        <span
          className="flex-1"
          title={!saved && !loading ? "먼저 프로필 저장을 눌러 주세요" : undefined}
        >
          <button
            type="submit"
            disabled={!saved || loading}
            className="w-full bg-[var(--color-ink)] text-[var(--color-ivory)] rounded-lg py-4 text-base font-semibold hover:bg-[var(--color-ink-light)] disabled:bg-[var(--color-ink-faint)] disabled:cursor-not-allowed transition-colors min-h-[52px] shadow-sm"
          >
            {loading ? "분석 중..." : "분석 시작"}
          </button>
        </span>
      </div>
    </form>
  );
}
