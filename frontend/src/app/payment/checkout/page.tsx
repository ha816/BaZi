"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadTossPayments, ANONYMOUS, type TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
const DEV_BYPASS = true; // TODO: !CLIENT_KEY 로 변경 (토스 키 설정 후)
const MEMBER_ID_KEY = "kkachi_member_id";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const widgetsRef = useRef<TossPaymentsWidgets | null>(null);

  const orderId = searchParams.get("order_id") ?? "";
  const amount = Number(searchParams.get("amount") ?? "0");
  const featureType = searchParams.get("feature_type") ?? "";
  const orderName = searchParams.get("order_name") ?? "사주까치";

  useEffect(() => {
    if (DEV_BYPASS) return;
    const customerKey = localStorage.getItem(MEMBER_ID_KEY) ?? ANONYMOUS;
    loadTossPayments(CLIENT_KEY!).then(async (tossPayments) => {
      const widgets = tossPayments.widgets({ customerKey });
      widgetsRef.current = widgets;
      await widgets.setAmount({ currency: "KRW", value: amount });
      await widgets.renderPaymentMethods({ selector: "#payment-widget", variantKey: "DEFAULT" });
      await widgets.renderAgreement({ selector: "#agreement", variantKey: "AGREEMENT" });
    });
  }, [amount]);

  const handlePay = async () => {
    if (DEV_BYPASS) {
      // 개발 bypass: confirm 없이 바로 크레딧 부여
      sessionStorage.setItem(`kkachi_credit_${featureType}`, "1");
      const redirectMap: Record<string, string> = {
        deep_analysis: "/analysis/deep",
        daily_fortune: "/analysis",
        compatibility: "/compatibility",
      };
      window.location.href = redirectMap[featureType] ?? "/";
      return;
    }
    if (!widgetsRef.current) return;
    try {
      await widgetsRef.current.requestPayment({
        orderId,
        orderName,
        successUrl: `${window.location.origin}/payment/success?feature_type=${featureType}`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch {
      // 사용자가 결제 취소한 경우 등 — 토스 SDK가 내부 처리
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-parchment)] flex flex-col items-center py-8 px-4">
      <h1 className="text-xl font-bold text-[var(--color-ink)] mb-2">{orderName}</h1>
      <p className="text-[var(--color-ink-light)] mb-6">₩{amount.toLocaleString()}</p>
      {DEV_BYPASS ? (
        <div className="w-full max-w-md bg-yellow-50 border border-yellow-300 rounded-2xl p-4 mb-4 text-sm text-yellow-700">
          <p className="font-bold mb-1">개발 모드 (결제 bypass)</p>
          <p>NEXT_PUBLIC_TOSS_CLIENT_KEY 미설정. 결제 없이 바로 진행됩니다.</p>
        </div>
      ) : (
        <div className="w-full max-w-md bg-white rounded-2xl shadow p-4 mb-4">
          <div id="payment-widget" />
          <div id="agreement" />
        </div>
      )}
      <button
        onClick={handlePay}
        className="w-full max-w-md bg-[var(--color-accent)] text-white font-bold py-4 rounded-2xl text-lg"
      >
        {DEV_BYPASS ? "결제 없이 진행 (개발)" : "결제하기"}
      </button>
      <button
        onClick={() => router.back()}
        className="mt-3 text-sm text-[var(--color-ink-light)]"
      >
        취소
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-[var(--color-ink-light)]">불러오는 중...</p></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
