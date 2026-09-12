import { MEMBER_ID_KEY } from "@/lib/constants";
import { deletePushSubscription, getVapidPublicKey, savePushSubscription } from "@/lib/api";
import { track } from "@/lib/track";

export type PushState = "unsupported" | "unconfigured" | "denied" | "off" | "on";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/");
  return existing ?? navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

/** 현재 상태 조회 — 버튼 표시용. 서버에 VAPID 키가 없으면 "unconfigured". */
export async function getPushState(): Promise<PushState> {
  if (!isPushSupported()) return "unsupported";
  try { await getVapidPublicKey(); } catch { return "unconfigured"; }
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = reg ? await reg.pushManager.getSubscription() : null;
  return sub ? "on" : "off";
}

export async function subscribePush(): Promise<PushState> {
  const memberId = localStorage.getItem(MEMBER_ID_KEY);
  if (!memberId) throw new Error("로그인이 필요해요");
  const { public_key } = await getVapidPublicKey();
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";
  const reg = await registration();
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(public_key) as BufferSource,
    }));
  const json = sub.toJSON();
  await savePushSubscription(memberId, {
    endpoint: sub.endpoint,
    keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
  });
  track("push_subscribe");
  return "on";
}

export async function unsubscribePush(): Promise<PushState> {
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = reg ? await reg.pushManager.getSubscription() : null;
  if (sub) {
    await deletePushSubscription(sub.endpoint).catch(() => {});
    await sub.unsubscribe();
  }
  track("push_unsubscribe");
  return "off";
}
