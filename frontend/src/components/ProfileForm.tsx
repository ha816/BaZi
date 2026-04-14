"use client";

import { useState } from "react";
import type { Profile, ProfileCreateInput } from "@/types/analysis";
import { createProfile } from "@/lib/api";
import { HOUR_OPTIONS, INPUT_CLASS } from "@/lib/constants";

interface Props {
  memberId: string;
  onSuccess: (profile: Profile) => void;
  onCancel: () => void;
  defaultCity?: string;
}

export default function ProfileForm({ memberId, onSuccess, onCancel, defaultCity }: Props) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("1990-01-01");
  const [selectedHour, setSelectedHour] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [city, setCity] = useState(defaultCity ?? "Seoul");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const hourOpt = HOUR_OPTIONS.find((h) => h.value === selectedHour);
      const data: ProfileCreateInput = {
        name: name.trim(),
        gender,
        birth_dt: `${birthDate}T${hourOpt?.time ?? "12:00"}:00`,
        city,
      };
      const profile = await createProfile(memberId, data);
      onSuccess(profile);
    } catch {
      setError("프로필 추가에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-[var(--color-border)] rounded-xl p-5 space-y-4 bg-[var(--color-ivory-warm)]"
    >
      <p className="text-sm font-medium text-[var(--color-ink)]">새 프로필 추가</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-[var(--color-ink-light)]">이름</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="홍길동" required className={INPUT_CLASS} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-[var(--color-ink-light)]">생년월일</span>
          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
            className={INPUT_CLASS} min="1920-01-01" max="2025-12-31" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-[var(--color-ink-light)]">태어난 시간</span>
          <select value={selectedHour} onChange={(e) => setSelectedHour(e.target.value)}
            className={`${INPUT_CLASS} appearance-none`}>
            {HOUR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-[var(--color-ink-light)]">도시</span>
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
            placeholder="Seoul" className={INPUT_CLASS} />
        </label>
      </div>
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-[var(--color-ink-light)]">성별</span>
        <div className="flex gap-3">
          {(["male", "female"] as const).map((g) => (
            <button key={g} type="button" onClick={() => setGender(g)}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                gender === g
                  ? "bg-[var(--color-ink)] text-[var(--color-ivory)]"
                  : "bg-white text-[var(--color-ink-muted)] border border-[var(--color-border)]"
              }`}>
              {g === "male" ? "남성" : "여성"}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-[var(--color-fire)]">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel}
          className="flex-1 py-3 rounded-lg text-sm border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:border-[var(--color-ink-faint)] transition-colors">
          취소
        </button>
        <button type="submit" disabled={loading}
          className="flex-[2] bg-[var(--color-ink)] text-[var(--color-ivory)] rounded-lg py-3 text-sm font-semibold hover:bg-[var(--color-ink-light)] disabled:bg-[var(--color-ink-faint)] transition-colors">
          {loading ? "저장 중..." : "저장하기"}
        </button>
      </div>
    </form>
  );
}
