"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listProfiles, getDailyFortune } from "@/lib/api";
import type { DailyFortune, Profile } from "@/types/analysis";
import KkachiTip from "@/components/KkachiTip";

const MEMBER_ID_KEY = "kkachi_member_id";

const LEVEL_META: Record<string, { label: string; color: string; bg: string }> = {
  최고: { label: "최고", color: "text-orange-500", bg: "bg-orange-50 border-orange-200" },
  좋음: { label: "좋음", color: "text-green-600", bg: "bg-green-50 border-green-200" },
  보통: { label: "보통", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
  주의: { label: "주의", color: "text-blue-500", bg: "bg-blue-50 border-blue-200" },
  나쁨: { label: "나쁨", color: "text-gray-500", bg: "bg-gray-50 border-gray-200" },
};

const DOMAIN_LABELS: Record<string, string> = {
  직업운: "직업",
  재물운: "재물",
  건강운: "건강",
  애정운: "애정",
  학업운: "학업",
};

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex-1 h-1.5 rounded-full bg-[var(--color-border-light)] overflow-hidden">
      <div
        className="h-full rounded-full bg-[var(--color-gold)]"
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

export default function FortunePage() {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fortune, setFortune] = useState<DailyFortune | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem(MEMBER_ID_KEY);
    if (!id) { setLoading(false); return; }
    setMemberId(id);
    listProfiles(id)
      .then((profiles) => {
        const self = profiles.find((p) => p.is_self) ?? profiles[0] ?? null;
        if (!self) { setLoading(false); return; }
        setProfile(self);
        return getDailyFortune(id, self.id);
      })
      .then((f) => { if (f) setFortune(f); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const lm = fortune ? (LEVEL_META[fortune.level] ?? LEVEL_META["보통"]) : null;

  return (
    <main className="min-h-screen py-8 px-4 pb-24">
      <div className="max-w-lg mx-auto space-y-4">
        <header>
          <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">오늘의 운세</h1>
        </header>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--color-gold-light)] border-t-transparent animate-spin" />
          </div>
        )}

        {/* 비로그인 */}
        {!loading && !memberId && (
          <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm p-8 flex flex-col items-center gap-4 text-center">
            <div className="text-5xl">🪄</div>
            <p className="text-base font-semibold text-[var(--color-ink)]">로그인하면 나만의 오늘의 운세를 볼 수 있어요</p>
            <p className="text-sm text-[var(--color-ink-muted)]">사주를 등록하면 오행·용신 기반으로 오늘의 기운을 분석해드려요</p>
            <Link href="/join" className="mt-2 px-6 py-2.5 rounded-full bg-[var(--color-gold)] text-white text-sm font-semibold">
              로그인 / 가입하기
            </Link>
          </div>
        )}

        {/* 로그인 but 프로필 없음 */}
        {!loading && memberId && !profile && (
          <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm p-8 flex flex-col items-center gap-4 text-center">
            <div className="text-5xl">📝</div>
            <p className="text-base font-semibold text-[var(--color-ink)]">사주 정보를 먼저 등록해주세요</p>
            <Link href="/profile" className="mt-2 px-6 py-2.5 rounded-full bg-[var(--color-gold)] text-white text-sm font-semibold">
              프로필 등록하기
            </Link>
          </div>
        )}

        {/* 운세 결과 */}
        {!loading && fortune && lm && (
          <>
            {/* 총점 카드 */}
            <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm py-8 px-6 flex flex-col items-center gap-2 text-center">
              <p className="text-sm text-[var(--color-ink-muted)]">{profile?.name}님의 오늘</p>
              <div className="text-6xl font-thin text-[var(--color-ink)] leading-none mt-1">{fortune.total_score}</div>
              <span className={`mt-1 px-3 py-0.5 rounded-full text-xs font-bold border ${lm.bg} ${lm.color}`}>{lm.label}</span>
              {fortune.day_pillar && (
                <p className="text-sm text-[var(--color-ink-faint)] mt-1">일진 {fortune.day_pillar}</p>
              )}
            </div>

            {/* KkachiTip — 오늘 총평 */}
            {fortune.description && (
              <KkachiTip text={fortune.description} />
            )}

            {/* TODO: 광고 영역 — 영역별 운세 상단 */}

            {/* 영역별 점수 */}
            <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm px-5 pt-4 pb-5 space-y-3">
              <p className="text-xs font-semibold text-[var(--color-ink-muted)]">영역별 운세</p>
              {Object.entries(fortune.domain_scores).map(([key, val]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-10 text-xs text-[var(--color-ink-muted)] shrink-0">{DOMAIN_LABELS[key] ?? key}</span>
                  <ScoreBar score={val.score} />
                  <span className="text-xs font-semibold text-[var(--color-ink)] w-6 text-right">{val.score}</span>
                </div>
              ))}
            </div>

            {/* 사주 분석 유도 CTA */}
            <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm px-5 py-5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-ink)]">점수가 왜 이렇게 나왔을까요?</p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">내 사주 구조와 오늘 일진의 관계를 심층 분석으로 확인해보세요</p>
              </div>
              <Link
                href="/analysis"
                className="shrink-0 px-4 py-2 rounded-full bg-[var(--color-gold)] text-white text-xs font-semibold whitespace-nowrap"
              >
                사주 분석하기
              </Link>
            </div>

            {/* KkachiTip — 조언 목록 */}
            {fortune.tips?.length > 0 && (
              <KkachiTip text={fortune.tips.join("\n")} />
            )}
          </>
        )}
      </div>
    </main>
  );
}
