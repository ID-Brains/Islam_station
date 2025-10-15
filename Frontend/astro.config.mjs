import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
// import node from "@astrojs/node";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    // Environment variables configuration
    env: {
        schema: {
            // API Configuration
            PUBLIC_API_URL: envField.string({ 
                context: "client", 
                access: "public", 
                default: "http://localhost:8000",
                optional: true 
            }),
            PUBLIC_API_TIMEOUT: envField.number({ 
                context: "client", 
                access: "public", 
                default: 30000,
                optional: true 
            }),
            PUBLIC_API_RETRY_ATTEMPTS: envField.number({ 
                context: "client", 
                access: "public", 
                default: 3,
                optional: true 
            }),
            PUBLIC_API_RETRY_DELAY: envField.number({ 
                context: "client", 
                access: "public", 
                default: 1000,
                optional: true 
            }),
            
            // Geolocation Configuration
            PUBLIC_LOCATION_TIMEOUT: envField.number({ 
                context: "client", 
                access: "public", 
                default: 10000,
                optional: true 
            }),
            PUBLIC_LOCATION_MAX_AGE: envField.number({ 
                context: "client", 
                access: "public", 
                default: 300000,
                optional: true 
            }),
            PUBLIC_LOCATION_HIGH_ACCURACY: envField.boolean({ 
                context: "client", 
                access: "public", 
                default: true,
                optional: true 
            }),
            
            // Prayer Configuration
            PUBLIC_DEFAULT_CALCULATION_METHOD: envField.string({ 
                context: "client", 
                access: "public", 
                default: "Egyptian",
                optional: true 
            }),
            PUBLIC_DEFAULT_LATITUDE: envField.string({ 
                context: "client", 
                access: "public", 
                default: "24.7136",
                optional: true 
            }),
            PUBLIC_DEFAULT_LONGITUDE: envField.string({ 
                context: "client", 
                access: "public", 
                default: "46.6753",
                optional: true 
            }),
            PUBLIC_ENABLE_PRAYER_NOTIFICATIONS: envField.boolean({ 
                context: "client", 
                access: "public", 
                default: true,
                optional: true 
            }),
            
            // App Configuration
            PUBLIC_APP_NAME: envField.string({ 
                context: "client", 
                access: "public", 
                default: "The Islamic Guidance Station",
                optional: true 
            }),
            PUBLIC_ENABLE_NOTIFICATIONS: envField.boolean({ 
                context: "client", 
                access: "public", 
                default: true,
                optional: true 
            }),
            PUBLIC_ENABLE_SERVICE_WORKER: envField.boolean({ 
                context: "client", 
                access: "public", 
                default: true,
                optional: true 
            }),
            PUBLIC_LOG_LEVEL: envField.string({ 
                context: "client", 
                access: "public", 
                default: "INFO",
                optional: true 
            }),
        },
    },
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
