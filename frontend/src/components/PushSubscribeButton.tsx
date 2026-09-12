"use client";

import { useEffect, useState } from "react";
import { getPushState, subscribePush, unsubscribePush, type PushState } from "@/lib/push";

/** 시운 화면 상단 — "아침 7시에 까치가 알려드려요" 알림 켜기/끄기. 미지원·미설정이면 렌더하지 않는다. */
export default function PushSubscribeButton() {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPushState().then(setState).catch(() => setState("unsupported"));
  }, []);

  if (!state || state === "unsupported" || state === "unconfigured") return null;

  const toggle = async () => {
    setBusy(true);
    setError(null);
    try {
      setState(state === "on" ? await unsubscribePush() : await subscribePush());
    } catch (e) {
      setError(e instanceof Error ? e.message : "알림 설정에 실패했어요");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-card)] px-4 py-3 flex items-center gap-3">
      <span className="text-2xl">{state === "on" ? "🔔" : "🐦"}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--color-ink)]">
          {state === "on" ? "아침 알림이 켜져 있어요" : "아침 7시, 까치가 오늘의 한 마디를 보내드려요"}
        </p>
        <p className="text-[11px] text-[var(--color-ink-faint)]">
          {state === "denied"
            ? "브라우저 알림이 차단되어 있어요. 사이트 설정에서 허용해 주세요."
            : error ?? (state === "on" ? "이 기기에서 매일 아침 알림을 받아요." : "홈 화면에 추가하면 앱처럼 알림을 받을 수 있어요.")}
        </p>
      </div>
      {state !== "denied" && (
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 ${
            state === "on"
              ? "border-[var(--color-border)] text-[var(--color-ink-muted)]"
              : "bg-[var(--color-gold)] text-white border-[var(--color-gold)]"
          }`}
        >
          {busy ? "…" : state === "on" ? "끄기" : "알림 켜기"}
        </button>
      )}
    </div>
  );
}
