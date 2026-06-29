/* Alebrijes Cobranza Service Worker
 *
 * Combina 2 responsabilidades:
 *  1. PWA (9.15) - offline cache del shell de la app
 *  2. Web Push (9.8) - muestra notificaciones nativas
 *
 * Para activar Push notifications:
 *  1. Generar claves VAPID (ver docs/PUSH-NOTIFICATIONS.md)
 *  2. Setear NEXT_PUBLIC_VAPID_PUBLIC_KEY en .env.local
 *  3. El admin hace click en "Activar notificaciones" en el topbar
 */

const CACHE_NAME = "alebrijes-v1";
const SHELL_URLS = ["/", "/manifest.json"];

// ---------- Install: pre-cache shell ----------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {}),
  );
  self.skipWaiting();
});

// ---------- Activate: clean old caches ----------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

// ---------- Fetch: network-first, fallback to cache ----------
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Skip non-http(s) and Supabase API calls
  if (!url.protocol.startsWith("http")) return;
  if (url.hostname.includes("supabase.co")) return;
  if (url.pathname.startsWith("/api/")) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        // Cache successful same-origin responses
        if (res.ok && url.origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || Response.error())),
  );
});

// ---------- Push: show native notification ----------
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Alebrijes Cobranza", body: event.data.text() };
  }
  const title = payload.title ?? "Alebrijes Cobranza";
  const options = {
    body: payload.body ?? "",
    icon: payload.icon ?? "/assets/alebrijes-escudo.png",
    badge: payload.badge ?? "/assets/alebrijes-escudo.png",
    tag: payload.tag,
    data: payload.data ?? {},
    requireInteraction: payload.requireInteraction ?? false,
    actions: payload.actions ?? [],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ---------- Notification click: focus or open the app ----------
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data ?? {};
  const url = data.url ?? "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow ? self.clients.openWindow(url) : null;
      }),
  );
});
