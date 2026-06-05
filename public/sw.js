/** Bump when PRECACHE or fetch strategy changes so activate() drops stale caches. */
const CACHE_NAME = "qwen-ui-lab-v6";

/** App shell and static assets safe to precache (no hashed Next chunks). */
const PRECACHE = [
  "/",
  "/offline.html",
  "/design-system",
  "/manifest.json",
  "/opengraph-image",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/icon.svg",
  "/icons/icon-maskable.svg",
  "/icons/apple-touch-icon.svg",
];

const OFFLINE_URL = "/offline.html";
const IMMUTABLE_PREFIX = "/_next/static/";

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function isNavigationRequest(request) {
  if (request.mode === "navigate") return true;
  const accept = request.headers.get("accept");
  return accept?.includes("text/html") ?? false;
}

async function cachePut(request, response) {
  if (!response.ok) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      void cachePut(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw new Error("network-unavailable");
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    void cachePut(request, response.clone());
  }
  return response;
}

async function navigationFallback(request) {
  try {
    return await networkFirst(request);
  } catch {
    const cachedPage = await caches.match(request);
    if (cachedPage) return cachedPage;

    const shell = await caches.match("/");
    if (shell) return shell;

    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;

    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (url.pathname.startsWith(IMMUTABLE_PREFIX)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  if (isNavigationRequest(event.request)) {
    event.respondWith(navigationFallback(event.request));
    return;
  }

  event.respondWith(
    networkFirst(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      throw new Error("asset-unavailable");
    }),
  );
});
