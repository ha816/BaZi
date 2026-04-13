"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProfileCreateInput } from "@/types/analysis";
import { createOrGetMember, listProfiles, createProfile } from "@/lib/api";
import { detectLocation } from "@/lib/location";

const MEMBER_ID_KEY = "kkachi_member_id";

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

export default function JoinPage() {
  const router = useRouter();

  // Step 1 state
  const [step, setStep] = useState<"account" | "profile">("account");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2 state
  const [memberId, setMemberId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const [birthDate, setBirthDate] = useState("1990-01-01");
  const [selectedHour, setSelectedHour] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [city, setCity] = useState("Seoul");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    detectLocation().then((loc) => {
      if (loc) setCity(loc.city);
    });
  }, []);

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const member = await createOrGetMember(name.trim(), email.trim());
      localStorage.setItem(MEMBER_ID_KEY, member.id);
      const existing = await listProfiles(member.id);
      if (existing.length > 0) {
        router.push("/");
      } else {
        setMemberId(member.id);
        setProfileName(name.trim());
        setStep("profile");
      }
    } catch {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) return;
    setProfileLoading(true);
    setProfileError(null);
    try {
      const hourOpt = HOUR_OPTIONS.find((h) => h.value === selectedHour);
      const data: ProfileCreateInput = {
        name: profileName.trim(),
        gender,
        birth_dt: `${birthDate}T${hourOpt?.time ?? "12:00"}:00`,
        city,
        is_self: true,
      };
      await createProfile(memberId, data);
      router.push("/");
    } catch {
      setProfileError("프로필 등록에 실패했습니다.");
    } finally {
      setProfileLoading(false);
    }
  };

  if (step === "profile") {
    return (
      <main className="min-h-screen flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md space-y-8">
          <header className="space-y-2">
            <h1 className="font-heading text-3xl font-bold text-[var(--color-ink)]">내 사주 등록</h1>
            <p className="text-sm text-[var(--color-ink-muted)]">
              정확한 분석을 위해 생년월일을 입력해주세요.
            </p>
          </header>

          <form
            onSubmit={handleProfileSubmit}
            className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-light)] shadow-sm p-7 space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-[var(--color-ink-light)]">이름</span>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="홍길동"
                  required
                  className={inputClass}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-[var(--color-ink-light)]">생년월일</span>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={inputClass}
                  min="1920-01-01"
                  max="2025-12-31"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-[var(--color-ink-light)]">태어난 시간</span>
                <select
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(e.target.value)}
                  className={`${inputClass} appearance-none`}
                >
                  {HOUR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-[var(--color-ink-light)]">도시</span>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Seoul"
                  className={inputClass}
                />
              </label>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-[var(--color-ink-light)]">성별</span>
              <div className="flex gap-3">
                {(["male", "female"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                      gender === g
                        ? "bg-[var(--color-ink)] text-[var(--color-ivory)]"
                        : "bg-white text-[var(--color-ink-muted)] border border-[var(--color-border)]"
                    }`}
                  >
                    {g === "male" ? "남성" : "여성"}
                  </button>
                ))}
              </div>
            </div>

            {profileError && <p className="text-sm text-[var(--color-fire)]">{profileError}</p>}

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full bg-[var(--color-ink)] text-[var(--color-ivory)] rounded-lg py-4 text-base font-semibold hover:bg-[var(--color-ink-light)] disabled:bg-[var(--color-ink-faint)] transition-colors shadow-sm"
            >
              {profileLoading ? "등록 중..." : "시작하기"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-8">
        <header className="space-y-3">
          <Link href="/" className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-gold)] transition-colors">
            ← 홈으로
          </Link>
          <div>
            <h1 className="font-heading text-3xl font-bold text-[var(--color-ink)]">시작하기</h1>
            <p className="text-sm text-[var(--color-ink-muted)] mt-2">
              영리한 명리 상담사 사주까치와 함께해보세요.<br />
              이미 가입한 이메일이면 기존 정보를 불러옵니다.
            </p>
          </div>
        </header>

        <form
          onSubmit={handleAccountSubmit}
          className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-light)] shadow-sm p-7 space-y-5"
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--color-ink-light)]">이름</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              required
              className={inputClass}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--color-ink-light)]">이메일</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hong@example.com"
              required
              className={inputClass}
            />
          </label>

          {error && <p className="text-sm text-[var(--color-fire)]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-ink)] text-[var(--color-ivory)] rounded-lg py-4 text-base font-semibold hover:bg-[var(--color-ink-light)] disabled:bg-[var(--color-ink-faint)] transition-colors shadow-sm"
          >
            {loading ? "확인 중..." : "다음"}
          </button>
        </form>
      </div>
    </main>
  );
}