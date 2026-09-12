import { MEMBER_ID_KEY } from "@/lib/constants";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const SESSION_KEY = "kkachi_session_id";

function sessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "no-storage-session";
  }
}

/** 행동 이벤트 한 건 전송 (fire-and-forget). 이름은 snake_case: home_view, daily_view, result_view, tab_view, push_subscribe, push_click … */
export function track(name: string, props: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  let memberId: string | null = null;
  try { memberId = localStorage.getItem(MEMBER_ID_KEY); } catch { /* ignore */ }
  const body = JSON.stringify({ session_id: sessionId(), name, member_id: memberId, props });
  fetch(`${API_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => { /* 측정 실패는 UX를 막지 않는다 */ });
}
