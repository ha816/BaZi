"use client";

import type { Profile } from "@/types/analysis";
import { HOUR_OPTIONS, INPUT_CLASS } from "@/lib/constants";

export interface ManualState {
  name: string;
  birthDate: string;
  selectedHour: string;
  gender: "male" | "female";
  city: string;
}

export interface PersonState {
  mode: "manual" | "profile";
  manual: ManualState;
  profileId: string;
}

export const DEFAULT_MANUAL: ManualState = {
  name: "",
  birthDate: "1990-01-01",
  selectedHour: "",
  gender: "male",
  city: "Seoul",
};

interface Props {
  label: string;
  state: PersonState;
  profiles: Profile[];
  onChange: (patch: Partial<PersonState>) => void;
}

export default function PersonCard({ label, state, profiles, onChange }: Props) {
  const { mode, manual, profileId } = state;
  const inputClass = INPUT_CLASS.replace("px-4 py-3 text-base", "px-3 py-2.5 text-sm").replace("bg-[var(--color-card)]", "bg-white");

  return (
    <div className="flex-1 bg-[var(--color-ivory-warm)] rounded-xl p-5 space-y-4 border border-[var(--color-border-light)]">
      <div className="flex items-center justify-between">
        <p className="text-xs tracking-[0.25em] text-[var(--color-gold)]">{label}</p>
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
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[var(--color-ink-light)]">도시</span>
            <input
              type="text"
              value={manual.city}
              onChange={(e) => onChange({ manual: { ...manual, city: e.target.value } })}
              placeholder="Seoul"
              className={inputClass}
            />
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
