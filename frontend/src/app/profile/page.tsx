"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Profile, ProfileCreateInput, ProfileUpdateInput } from "@/types/analysis";
import { listProfiles, createProfile, updateProfile, deleteProfile } from "@/lib/api";
import { detectLocation } from "@/lib/location";

const MEMBER_ID_KEY = "kkachi_member_id";
const MAX_PROFILES = 10;

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

const inputClass =
  "w-full border border-[var(--color-border)] rounded-lg px-4 py-3 text-base bg-[var(--color-card)] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold-light)] focus:outline-none transition-colors";

function _hourFromDatetime(birth_dt: string): string {
  const hour = new Date(birth_dt).getHours();
  const opt = HOUR_OPTIONS.find((h) => h.value !== "" && parseInt(h.value) === hour);
  return opt?.value ?? "";
}

function _dateFromDatetime(birth_dt: string): string {
  return birth_dt.slice(0, 10);
}

function ProfileForm({
  memberId,
  onSuccess,
  onCancel,
  defaultCity,
}: {
  memberId: string;
  onSuccess: (profile: Profile) => void;
  onCancel: () => void;
  defaultCity?: string;
}) {
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
            placeholder="홍길동" required className={inputClass} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-[var(--color-ink-light)]">생년월일</span>
          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
            className={inputClass} min="1920-01-01" max="2025-12-31" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-[var(--color-ink-light)]">태어난 시간</span>
          <select value={selectedHour} onChange={(e) => setSelectedHour(e.target.value)}
            className={`${inputClass} appearance-none`}>
            {HOUR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-[var(--color-ink-light)]">도시</span>
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
            placeholder="Seoul" className={inputClass} />
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

function ProfileCard({
  profile,
  memberId,
  onDelete,
  onUpdate,
}: {
  profile: Profile;
  memberId: string;
  onDelete: (id: string) => void;
  onUpdate: (updated: Profile) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);

  // Edit state
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

        {/* Row 1: 이름 + 성별 */}
        <div className="flex gap-4">
          <label className="flex-1 space-y-2">
            <span className="text-sm font-medium text-[var(--color-ink-light)]">이름</span>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
              required className={inputClass} />
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

        {/* Row 2: 생년월일 + 태어난 시간 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--color-ink-light)]">생년월일</span>
            <input type="date" value={editBirthDate} onChange={(e) => setEditBirthDate(e.target.value)}
              className={inputClass} min="1920-01-01" max="2025-12-31" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--color-ink-light)]">태어난 시간</span>
            <select value={editHour} onChange={(e) => setEditHour(e.target.value)}
              className={`${inputClass} appearance-none`}>
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

export default function ProfilePage() {
  const router = useRouter();
  const [memberId, setMemberId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detectedCity, setDetectedCity] = useState<string | undefined>();

  useEffect(() => {
    detectLocation().then((loc) => { if (loc) setDetectedCity(loc.city); });
  }, []);

  useEffect(() => {
    const id = localStorage.getItem(MEMBER_ID_KEY);
    if (!id) { router.replace("/join"); return; }
    setMemberId(id);
    listProfiles(id)
      .then(setProfiles)
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-gold-light)] border-t-transparent animate-spin" />
      </main>
    );
  }

  const canAddMore = profiles.length < MAX_PROFILES;

  return (
    <main className="min-h-screen py-10 md:py-16 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-3">
          <Link href="/" className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-gold)] transition-colors">
            ← 홈으로
          </Link>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold text-[var(--color-ink)]">프로필 관리</h1>
            </div>
            <Link href="/my" className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-gold)] transition-colors">
              계정 설정 →
            </Link>
          </div>
        </header>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-[var(--color-ink)]">
              저장된 프로필
              {profiles.length > 0 && (
                <span className="ml-2 text-sm font-normal text-[var(--color-ink-faint)]">{profiles.length} / {MAX_PROFILES}</span>
              )}
            </h2>
            {!showForm && canAddMore && (
              <button onClick={() => setShowForm(true)}
                className="text-sm text-[var(--color-gold)] hover:text-[var(--color-gold-light)] transition-colors font-medium">
                + 프로필 추가
              </button>
            )}
            {!showForm && !canAddMore && (
              <span className="text-xs text-[var(--color-ink-faint)]">최대 {MAX_PROFILES}개</span>
            )}
          </div>

          {showForm && memberId && (
            <ProfileForm
              memberId={memberId}
              onSuccess={(p) => { setProfiles((prev) => [p, ...prev]); setShowForm(false); }}
              onCancel={() => setShowForm(false)}
              defaultCity={detectedCity}
            />
          )}

          {profiles.length === 0 && !showForm && (
            <div className="text-center py-12 text-[var(--color-ink-faint)] text-sm">
              아직 저장된 프로필이 없습니다.<br />
              나와 소중한 분들의 사주를 등록해보세요.
            </div>
          )}

          <div className="space-y-3">
            {profiles.map((p) => (
              <ProfileCard
                key={p.id}
                profile={p}
                memberId={memberId!}
                onDelete={(id) => setProfiles((prev) => prev.filter((x) => x.id !== id))}
                onUpdate={(updated) => setProfiles((prev) => prev.map((x) => x.id === updated.id ? updated : x))}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
