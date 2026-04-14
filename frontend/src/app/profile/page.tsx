"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/analysis";
import { listProfiles } from "@/lib/api";
import { detectLocation } from "@/lib/location";
import { MEMBER_ID_KEY } from "@/lib/constants";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProfileForm from "@/components/ProfileForm";
import ProfileCard from "@/components/ProfileCard";

const MAX_PROFILES = 10;

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
        <LoadingSpinner />
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
