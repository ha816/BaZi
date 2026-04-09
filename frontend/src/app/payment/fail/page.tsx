"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function FailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message") ?? "결제가 취소되었습니다.";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-4xl mb-4">😢</div>
      <h1 className="text-xl font-bold text-[var(--color-ink)] mb-2">결제 실패</h1>
      <p className="text-[var(--color-ink-light)] mb-8">{message}</p>
      <button
        onClick={() => router.back()}
        className="px-6 py-3 bg-[var(--color-accent)] text-white rounded-xl font-semibold"
      >
        다시 시도하기
      </button>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-[var(--color-ink-light)]">불러오는 중...</p></div>}>
      <FailContent />
    </Suspense>
  );
}
