 const options = { method: 'GET', headers: { accept: 'application/json' } };

        fetch('https://api-staging.quranhub.com/v1/ayah/random', options)
            .then(res => res.json())
            .then(data => {
                console.log('API Response:', data);
                
                const quranText = document.getElementById('quran-text');
                const ayahText = document.getElementById('ayah-text');

                if (quranText && ayahText && data.data && data.data.text) {
                    quranText.textContent = data.data.text;
                    ayahText.textContent = `سورة ${data.data.surah.name} · آية ${data.data.numberInSurah}`;
                } else {
                    console.log('No ayah found in response');
                }
            })
            .catch(err => {
                console.error('خطأ في تحميل الآية:', err);
                const quranText = document.getElementById('quran-text');
                if (quranText) {
                    quranText.textContent = 'حدث خطأ أثناء جلب الآية. الرجاء المحاولة مرة أخرى لاحقًا.';
                }
            });