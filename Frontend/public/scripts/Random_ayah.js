const options = { method: "GET", headers: { accept: "application/json" } };

const apiBase = typeof window !== "undefined" && window.API_BASE ? window.API_BASE : "";
fetch(`${apiBase}/api/quran/random`, options)
    .then((res) => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    })
    .then((data) => {
        console.log("API Response:", data);

        const quranText = document.getElementById("quran-text");
        const ayahText = document.getElementById("ayah-text");

        if (quranText && ayahText && data.verse) {
            const verse = data.verse;
            quranText.textContent = verse.ayah_ar || verse.text || "جاري تحميل الآية...";
            ayahText.textContent = `سورة ${verse.surah_name_ar || verse.surah_name || "غير معروف"} · آية ${verse.ayah_no_surah || verse.verse_number || "غير معروف"}`;
        } else {
            console.log("No ayah found in response");
            quranText.textContent = "لم يتم العثور على آية";
            ayahText.textContent = "";
        }
    })
    .catch((err) => {
        console.error("Error loading verse:", err);
        const quranText = document.getElementById("quran-text");
        const ayahText = document.getElementById("ayah-text");
        if (quranText) {
            quranText.textContent = "حدث خطأ أثناء جلب الآية. الرجاء المحاولة مرة أخرى لاحقًا.";
        }
        if (ayahText) {
            ayahText.textContent = "";
        }
    });
