"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createOrGetMember } from "@/lib/api";

const MEMBER_ID_KEY = "kkachi_member_id";

const inputClass =
  "w-full border border-[var(--color-border)] rounded-lg px-4 py-3 text-base bg-[var(--color-card)] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold-light)] focus:outline-none transition-colors";

export default function JoinPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const member = await createOrGetMember(name.trim(), email.trim());
      localStorage.setItem(MEMBER_ID_KEY, member.id);
      router.push("/profile");
    } catch {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-8">
        <header className="space-y-3">
          <Link href="/" className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-gold)] transition-colors">
            ← 홈으로
          </Link>
          <div>
            <p className="text-xs tracking-[0.3em] text-[var(--color-gold)]">사주까치</p>
            <h1 className="font-heading text-3xl font-bold text-[var(--color-ink)] mt-1">시작하기</h1>
            <p className="text-sm text-[var(--color-ink-muted)] mt-2">
              영리한 명리 상담사 사주까치와 함께해보세요.<br />
              이미 가입한 이메일이면 기존 정보를 불러옵니다.
            </p>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
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
            {loading ? "확인 중..." : "시작하기"}
          </button>
        </form>
      </div>
    </main>
  );
}
