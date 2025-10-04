import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    plugins: [
      tailwindcss(),
      // Vite PWA plugin
      VitePWA({
        registerType: 'autoUpdate', // keep SW updated
        devOptions: {
          enabled: false // switch to true only for local SW during dev if needed
        },
        manifest: {
          name: "Islam Station",
          short_name: "IslamStation",
          description: "A unified platform for Quran search, prayer times, and spiritual guidance",
          start_url: "/",
          display: "standalone",
          background_color: "#ffffff",
          theme_color: "#0ea5a4",
          icons: [
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png"
            }
          ]
        },
        workbox: {
          // default precaching; tune runtimeCaching for API routes if needed
        },
        // Make explicit filename so we can register it easily
        filename: 'sw.js'
      })
    ]
  },
  integrations: [react()],
});