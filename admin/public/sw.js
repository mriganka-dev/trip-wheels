const CACHE_NAME = "tw-partner-v1";
const OFFLINE_URL = "/offline";

const STATIC_SHELL_FILES = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

// 1. Install event: pre-cache static shell files and offline page
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_SHELL_FILES);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 2. Activate event: clean up outdated caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3. Fetch event: Network-first for navigations with offline fallback.
// CRITICAL PLATFORM RULE: NEVER cache API responses (/api/v1/...) because stale booking data is harmful.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Strictly skip all API requests from caching
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Page navigations: network first, fallback to offline page if failed
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL).then((offlineRes) => {
          return offlineRes || caches.match("/");
        });
      })
    );
    return;
  }

  // Static assets (scripts, styles, icons, fonts): cache-first then network
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg")
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }
});

// 4. Push event: read JSON payload and display partner alert notification
self.addEventListener("push", (event) => {
  let payload = {
    title: "Trip Wheels Partner Alert",
    body: "You have a new partner update.",
    link: "/",
  };

  if (event.data) {
    try {
      const data = event.data.json();
      payload = {
        title: data.title || payload.title,
        body: data.body || payload.body,
        link: data.link || data.url || (data.data && data.data.bookingId ? `/bookings/${data.data.bookingId}` : "/"),
        data: data.data || {},
      };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  const notificationOptions = {
    body: payload.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [200, 100, 200],
    data: {
      link: payload.link,
      ...payload.data,
    },
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  );
});

// 5. Notification click event: focus open window/tab or open new one
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.link) || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // If a tab is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // If no tab is open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
