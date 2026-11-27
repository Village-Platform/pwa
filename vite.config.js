import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "node:url";

// "/" by default. The GitHub Pages workflow builds with BASE_PATH=/pwa/ (project site); a custom
// domain would set it back to "/".
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  base,
  resolve: {
    // "@/lib/strings" = src/lib/strings. Used by the tests (tests/ mirrors src/); keep in sync with tsconfig paths.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx,js,jsx}"],
    setupFiles: ["./tests/setup.ts"],
    css: false,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["fonts/*.ttf", "brand/*", "icons/apple-touch-icon.png", "icons/favicon-32.png"],
      manifest: {
        id: base,
        name: "أجهور الكبرى",
        short_name: "أجهور",
        description: "كل خدمات قريتك في مكان واحد",
        lang: "ar",
        dir: "rtl",
        start_url: base,
        scope: base,
        display: "standalone",
        orientation: "portrait",
        background_color: "#FFFFFF",
        theme_color: "#0B3727",
        icons: [
          { src: `${base}icons/icon-192.png`, sizes: "192x192", type: "image/png" },
          { src: `${base}icons/icon-512.png`, sizes: "512x512", type: "image/png" },
          { src: `${base}icons/maskable-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Shows Firebase Cloud Messaging pushes and routes their taps (src/lib/push.ts).
        importScripts: ["push-sw.js"],
        // App shell: every navigation gets index.html from the cache, so the app opens offline.
        navigateFallback: `${base}index.html`,
        globPatterns: ["**/*.{js,css,html,png,jpg,svg,ttf}"],
        runtimeCaching: [
          {
            // Read-only API data: show the last answer offline, refresh when online.
            // Only GETs are cached; auth, writes and the notification inbox always go to the network.
            urlPattern: ({ url, request }) =>
              request.method === "GET" &&
              /\/api\/v1\/(categories|firms|articles|app_config)/.test(url.pathname) &&
              !url.pathname.endsWith("/icon") &&
              // Owner- and reviewer-specific lists must never be served from a shared cache.
              !url.searchParams.has("mine") &&
              !url.searchParams.has("review"),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-read",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 200, maxAgeSeconds: 24 * 3600 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Category icons are versioned (?v=…) by the server, so cache-first is safe.
            urlPattern: ({ url }) => url.pathname.endsWith("/icon"),
            handler: "CacheFirst",
            options: {
              cacheName: "category-icons",
              expiration: { maxEntries: 100, maxAgeSeconds: 365 * 24 * 3600 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
