"use client";

import PageHeader from "@/components/PageHeader";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/analysis";
import { listProfiles, setSelfProfile } from "@/lib/api";
import { detectLocation } from "@/lib/location";
import { MEMBER_ID_KEY } from "@/lib/constants";
import { useStorageValue } from "@/lib/useStorageValue";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProfileForm from "@/components/ProfileForm";
import ProfileCard from "@/components/ProfileCard";

const MAX_PROFILES = 10;

export default function ProfilePage() {
  const router = useRouter();
  const storedMember = useStorageValue(MEMBER_ID_KEY);
  const memberId = storedMember || null;
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detectedCity, setDetectedCity] = useState<string | undefined>();

  useEffect(() => {
    detectLocation().then((loc) => { if (loc) setDetectedCity(loc.city); });
  }, []);

  useEffect(() => {
    if (storedMember === null) return; // 하이드레이션 전
    if (!storedMember) { router.replace("/join"); return; }
    listProfiles(storedMember)
      .then(setProfiles)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [storedMember, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </main>
    );
  }

  const canAddMore = profiles.length < MAX_PROFILES;

  return (
    <main className="page">
      <div className="page__inner">
        <PageHeader
          title="프로필 관리"
          description="나와 소중한 분들의 사주 정보를 등록하고 관리하세요."
          actions={
            <Link href="/my" className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-gold)] transition-colors">
              계정 설정 →
            </Link>
          }
        />

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
              기본 프로필이 아직 없어요.<br />
              먼저 나의 사주를 등록해 주세요. 첫 프로필이 곧 기본 프로필(나)이 돼요.
            </div>
          )}

          {profiles.length > 0 && (
            <p className="text-[11px] text-[var(--color-ink-faint)]">&quot;나&quot; 표시가 기본 프로필이에요. 분석·궁합·시운에서 따로 고르지 않으면 이 프로필로 봐요.</p>
          )}
          <div className="space-y-3">
            {profiles.map((p) => (
              <ProfileCard
                key={p.id}
                profile={p}
                memberId={memberId!}
                onDelete={(id) => setProfiles((prev) => prev.filter((x) => x.id !== id))}
                onUpdate={(updated) => setProfiles((prev) => prev.map((x) => x.id === updated.id ? updated : x))}
                onSetSelf={() => setSelfProfile(memberId!, p.id).then(() => listProfiles(memberId!)).then(setProfiles).catch(() => {})}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
