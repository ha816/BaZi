"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPayment } from "@/lib/api";

const REDIRECT_MAP: Record<string, string> = {
  deep_analysis: "/analysis/deep",
  daily_fortune: "/analysis",
  compatibility: "/compatibility",
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey") ?? "";
    const orderId = searchParams.get("orderId") ?? "";
    const amount = Number(searchParams.get("amount") ?? "0");
    const featureType = searchParams.get("feature_type") ?? "";

    confirmPayment({ payment_key: paymentKey, order_id: orderId, amount })
      .then(() => {
        sessionStorage.setItem(`kkachi_credit_${featureType}`, "1");
        router.replace(REDIRECT_MAP[featureType] ?? "/");
      })
      .catch(() => setError("결제 확인 중 오류가 발생했습니다. 고객센터에 문의해주세요."));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => router.replace("/")} className="text-[var(--color-accent)]">
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-[var(--color-ink-light)]">결제 확인 중...</p>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-[var(--color-ink-light)]">불러오는 중...</p></div>}>
      <SuccessContent />
    </Suspense>
  );
}
