import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
// import node from "@astrojs/node";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    output: "static",
    // adapter: node({ mode: "standalone" }),
    vite: {
        plugins: [
            tailwindcss(),
            VitePWA({
                registerType: "autoUpdate",
                devOptions: {
                    enabled: true, //warning : set to false in production
                },
                manifest: {
                    name: "Islam Station",
                    short_name: "IslamStation",
                    description:
                        "A unified platform for Quran search, prayer times, and spiritual guidance",
                    start_url: "/",
                    display: "standalone",
                    background_color: "#ffffff",
                    theme_color: "#0ea5a4",
                    icons: [
                        {
                            src: "/pwa-192x192.svg",
                            sizes: "any",
                            type: "image/svg+xml",
                        },
                        {
                            src: "/pwa-512x512.svg",
                            sizes: "any",
                            type: "image/svg+xml",
                        },
                    ],
                },
                includeAssets: [
                    "index.html",
                    "manifest.webmanifest",
                    "pwa-192x192.svg",
                    "pwa-512x512.svg",
                    "masjed.png",
                ],
                workbox: {
                    additionalManifestEntries: [{ url: "index.html", revision: null }],
                },
                filename: "sw.js",
            }),
        ],
    },
    integrations: [react()],
});
