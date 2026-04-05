"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Member } from "@/types/analysis";
import { getMember, deleteMember } from "@/lib/api";

const MEMBER_ID_KEY = "bazi_member_id";

export default function MyPage() {
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm" | "deleting">("idle");
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem(MEMBER_ID_KEY);
    if (!id) { router.replace("/join"); return; }
    getMember(id)
      .then(setMember)
      .catch(() => { localStorage.removeItem(MEMBER_ID_KEY); router.replace("/join"); })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem(MEMBER_ID_KEY);
    router.push("/");
  };

  const handleDelete = async () => {
    if (!member) return;
    if (deleteInput.trim() !== member.email) {
      setDeleteError("이메일이 일치하지 않습니다.");
      return;
    }
    setDeleteStep("deleting");
    try {
      await deleteMember(member.id);
      localStorage.removeItem(MEMBER_ID_KEY);
      router.push("/");
    } catch {
      setDeleteStep("confirm");
      setDeleteError("탈퇴 처리 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-gold-light)] border-t-transparent animate-spin" />
      </main>
    );
  }

  if (!member) return null;

  return (
    <main className="min-h-screen py-10 md:py-16 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-3">
          <Link href="/" className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-gold)] transition-colors">
            ← 홈으로
          </Link>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs tracking-[0.3em] text-[var(--color-gold)]">내 계정</p>
              <h1 className="font-heading text-3xl font-bold text-[var(--color-ink)] mt-1">계정 설정</h1>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors"
            >
              로그아웃
            </button>
          </div>
        </header>

        {/* 계정 정보 */}
        <section className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-light)] shadow-sm p-7 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-[var(--color-ink)]">계정 정보</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-light)]">
              <span className="text-sm text-[var(--color-ink-faint)]">이름</span>
              <span className="text-sm font-medium text-[var(--color-ink)]">{member.name}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-light)]">
              <span className="text-sm text-[var(--color-ink-faint)]">이메일</span>
              <span className="text-sm font-medium text-[var(--color-ink)]">{member.email}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-[var(--color-ink-faint)]">가입일</span>
              <span className="text-sm text-[var(--color-ink-muted)]">
                {new Date(member.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
          </div>
          <Link
            href="/profile"
            className="inline-block text-sm text-[var(--color-gold)] hover:text-[var(--color-gold-light)] transition-colors font-medium"
          >
            프로필 관리 →
          </Link>
        </section>

        {/* 탈퇴 */}
        <section className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-light)] shadow-sm p-7 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-[var(--color-ink)]">회원 탈퇴</h2>
          <p className="text-sm text-[var(--color-ink-faint)] leading-relaxed">
            탈퇴하면 저장된 모든 프로필과 분석 결과가 영구 삭제되며 복구할 수 없습니다.
          </p>

          {deleteStep === "idle" && (
            <button
              onClick={() => setDeleteStep("confirm")}
              className="text-sm text-[var(--color-fire)] hover:opacity-70 transition-opacity"
            >
              탈퇴하기
            </button>
          )}

          {(deleteStep === "confirm" || deleteStep === "deleting") && (
            <div className="space-y-3 pt-2 border-t border-[var(--color-border-light)]">
              <p className="text-sm text-[var(--color-ink-light)]">
                확인을 위해 가입한 이메일 주소를 입력해주세요.
              </p>
              <input
                type="email"
                value={deleteInput}
                onChange={(e) => { setDeleteInput(e.target.value); setDeleteError(null); }}
                placeholder={member.email}
                className="w-full border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm bg-white text-[var(--color-ink)] focus:border-[var(--color-fire)] focus:outline-none transition-colors"
              />
              {deleteError && <p className="text-xs text-[var(--color-fire)]">{deleteError}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => { setDeleteStep("idle"); setDeleteInput(""); setDeleteError(null); }}
                  disabled={deleteStep === "deleting"}
                  className="flex-1 py-2.5 rounded-lg text-sm border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:border-[var(--color-ink-faint)] transition-colors disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteStep === "deleting"}
                  className="flex-1 py-2.5 rounded-lg text-sm bg-[var(--color-fire)] text-white hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {deleteStep === "deleting" ? "처리 중..." : "탈퇴 확인"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
