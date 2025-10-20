import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import enTranslations from "./locales/en.json";
import arTranslations from "./locales/ar.json";

const resources = {
    en: {
        translation: enTranslations,
    },
    ar: {
        translation: arTranslations,
    },
};

i18n
    // Detect user language
    .use(LanguageDetector)
    // Pass i18n instance to react-i18next
    .use(initReactI18next)
    // Initialize i18next
    .init({
        resources,
        fallbackLng: "ar", // Default language (Arabic)
        lng: "ar", // Force initial language to Arabic
        debug: false, // Set to true for development

        detection: {
            order: ["localStorage", "navigator", "htmlTag"],
            caches: ["localStorage"],
            lookupLocalStorage: "islam-station-language",
        },

        interpolation: {
            escapeValue: false, // React already safes from xss
        },

        react: {
            useSuspense: false,
        },
    });

export default i18n;
