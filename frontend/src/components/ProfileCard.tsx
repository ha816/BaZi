"use client";

import { useState } from "react";
import type { Profile, ProfileUpdateInput } from "@/types/analysis";
import { updateProfile, deleteProfile } from "@/lib/api";
import { HOUR_OPTIONS, INPUT_CLASS } from "@/lib/constants";

function _hourFromDatetime(birth_dt: string): string {
  const hour = new Date(birth_dt).getHours();
  const opt = HOUR_OPTIONS.find((h) => h.value !== "" && parseInt(h.value) === hour);
  return opt?.value ?? "";
}

function _dateFromDatetime(birth_dt: string): string {
  return birth_dt.slice(0, 10);
}

interface Props {
  profile: Profile;
  memberId: string;
  onDelete: (id: string) => void;
  onUpdate: (updated: Profile) => void;
}

export default function ProfileCard({ profile, memberId, onDelete, onUpdate }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editBirthDate, setEditBirthDate] = useState(_dateFromDatetime(profile.birth_dt));
  const [editHour, setEditHour] = useState(_hourFromDatetime(profile.birth_dt));
  const [editGender, setEditGender] = useState<"male" | "female">(profile.gender);
  const [editCity, setEditCity] = useState(profile.city);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProfile(memberId, profile.id);
      onDelete(profile.id);
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    try {
      const hourOpt = HOUR_OPTIONS.find((h) => h.value === editHour);
      const data: ProfileUpdateInput = {
        name: editName.trim(),
        gender: editGender,
        birth_dt: `${editBirthDate}T${hourOpt?.time ?? "12:00"}:00`,
        city: editCity,
      };
      const updated = await updateProfile(memberId, profile.id, data);
      onUpdate(updated);
      setEditing(false);
    } catch {
      setEditError("수정에 실패했습니다.");
    } finally {
      setEditLoading(false);
    }
  };

  if (editing) {
    return (
      <form
        onSubmit={handleEditSubmit}
        className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-gold-light)] shadow-sm p-7 space-y-7"
      >
        <p className="text-sm font-medium text-[var(--color-ink)]">
          프로필 수정
          {profile.is_self && <span className="ml-2 text-xs text-[var(--color-gold)] font-normal">나</span>}
        </p>
        <div className="flex gap-4">
          <label className="flex-1 space-y-2">
            <span className="text-sm font-medium text-[var(--color-ink-light)]">이름</span>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
              required className={INPUT_CLASS} />
          </label>
          <div className="space-y-2 w-36">
            <span className="text-sm font-medium text-[var(--color-ink-light)]">성별</span>
            <div className="flex gap-2 h-[50px]">
              {(["male", "female"] as const).map((g) => (
                <button key={g} type="button" onClick={() => setEditGender(g)}
                  className={`flex-1 rounded-lg text-sm font-medium transition-all ${
                    g === "male"
                      ? editGender === "male"
                        ? "bg-blue-100 text-blue-600 border border-blue-300"
                        : "bg-[var(--color-ivory)] text-[var(--color-ink-faint)] border border-[var(--color-border)]"
                      : editGender === "female"
                        ? "bg-pink-100 text-pink-500 border border-pink-300"
                        : "bg-[var(--color-ivory)] text-[var(--color-ink-faint)] border border-[var(--color-border)]"
                  }`}>
                  {g === "male" ? "남" : "여"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--color-ink-light)]">생년월일</span>
            <input type="date" value={editBirthDate} onChange={(e) => setEditBirthDate(e.target.value)}
              className={INPUT_CLASS} min="1920-01-01" max="2025-12-31" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--color-ink-light)]">태어난 시간</span>
            <select value={editHour} onChange={(e) => setEditHour(e.target.value)}
              className={`${INPUT_CLASS} appearance-none`}>
              {HOUR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        </div>
        {editError && <p className="text-sm text-[var(--color-fire)]">{editError}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={() => setEditing(false)}
            className="flex-1 py-4 rounded-lg text-base border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:border-[var(--color-ink-faint)] transition-colors">
            취소
          </button>
          <button type="submit" disabled={editLoading}
            className="flex-[2] bg-[var(--color-ink)] text-[var(--color-ivory)] rounded-lg py-4 text-base font-semibold hover:bg-[var(--color-ink-light)] disabled:bg-[var(--color-ink-faint)] transition-colors shadow-sm">
            {editLoading ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-card)]">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <p className="text-base font-medium text-[var(--color-ink)]">{profile.name}</p>
          {profile.is_self && (
            <span className="text-xs text-[var(--color-gold)] border border-[var(--color-gold-light)] rounded-full px-2 py-0.5">나</span>
          )}
        </div>
        <p className="text-sm text-[var(--color-ink-faint)]">
          {new Date(profile.birth_dt).getFullYear()}년생 · {profile.gender === "male" ? "남성" : "여성"} · {profile.city}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {!confirming && (
          <button onClick={() => setEditing(true)}
            className="text-xs text-[var(--color-gold)] hover:opacity-70 transition-opacity px-2 py-1">
            수정
          </button>
        )}
        {!profile.is_self && (
          confirming ? (
            <>
              <button onClick={() => setConfirming(false)}
                className="text-xs text-[var(--color-ink-faint)] px-3 py-1.5 rounded-lg border border-[var(--color-border)]">
                취소
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="text-xs text-white px-3 py-1.5 rounded-lg bg-[var(--color-fire)] hover:opacity-80 transition-opacity">
                {deleting ? "삭제 중" : "삭제 확인"}
              </button>
            </>
          ) : (
            <button onClick={() => setConfirming(true)}
              className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-fire)] transition-colors px-2 py-1">
              삭제
            </button>
          )
        )}
      </div>
    </div>
  );
}
