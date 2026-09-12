/* 사주까치 서비스워커 — 아침 알림 수신·클릭 처리만 담당 (오프라인 캐시 없음) */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: "🐦 까치 왔어요", body: event.data ? event.data.text() : "" }; }
  const title = data.title || "🐦 까치 왔어요";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "오늘의 기운을 확인해보세요.",
      icon: "/kkachi/icon-192.png",
      badge: "/kkachi/icon-192.png",
      tag: data.tag || "kkachi-daily",
      renotify: true,
      data: { url: data.url || "/siun?src=push" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/siun?src=push";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) { c.navigate(url); return c.focus(); }
      }
      return self.clients.openWindow(url);
    }),
  );
});
