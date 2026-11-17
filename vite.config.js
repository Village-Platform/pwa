import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["fonts/*.ttf", "brand/*", "icons/apple-touch-icon.png", "icons/favicon-32.png"],
      manifest: {
        id: "/",
        name: "أجهور الكبرى",
        short_name: "أجهور",
        description: "كل خدمات قريتك في مكان واحد",
        lang: "ar",
        dir: "rtl",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#FFFFFF",
        theme_color: "#0B3727",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // App shell: every navigation gets index.html from the cache, so the app opens offline.
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,png,jpg,svg,ttf}"],
        runtimeCaching: [
          {
            // Read-only API data: show the last answer offline, refresh when online.
            // Only GETs are cached; auth, writes and the notification inbox always go to the network.
            urlPattern: ({ url, request }) =>
              request.method === "GET" &&
              /\/api\/v1\/(categories|firms|articles|app_config)/.test(url.pathname) &&
              !url.pathname.endsWith("/icon"),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-read",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 3600 },
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
