// Menggunakan node-fetch untuk melakukan panggilan HTTP di lingkungan Node.js
const fetch = require('node-fetch');

// Handler utama untuk Netlify Function
exports.handler = async (event) => {
    // Hanya izinkan metode POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        console.log("--- Memulai Fungsi Gemini ---");

        // Ambil semua variabel lingkungan (environment variables) dari Netlify
        const envVars = process.env;

        // 1. TEMUKAN SEMUA KUNCI API
        const apiKeys = Object.keys(envVars)
            .filter(key => key.startsWith('GEMINI_API_KEY_'))
            .map(key => envVars[key]);
        
        // LOGGING: Tampilkan berapa banyak kunci yang ditemukan
        console.log(`[LOG] Ditemukan ${apiKeys.length} kunci API.`);

        if (apiKeys.length === 0) {
            console.error("[ERROR] Tidak ada GEMINI_API_KEY_ yang ditemukan.");
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Tidak ada GEMINI_API_KEY yang ditemukan di pengaturan Netlify. Pastikan namanya diakhiri garis bawah (contoh: GEMINI_API_KEY_1).' }),
            };
        }

        // 2. PILIH SATU KUNCI SECARA ACAK
        const randomIndex = Math.floor(Math.random() * apiKeys.length);
        const selectedApiKey = apiKeys[randomIndex];

        // LOGGING: Tampilkan kunci mana yang dipilih (secara anonim)
        console.log(`[LOG] Menggunakan Kunci API #${randomIndex + 1}.`);

        const { apiUrl, payload } = JSON.parse(event.body);

        if (!apiUrl || !payload) {
             console.error("[ERROR] apiUrl atau payload tidak ada dalam permintaan.");
             return { statusCode: 400, body: JSON.stringify({ error: 'apiUrl dan payload dibutuhkan.' }) };
        }
        
        const urlWithKey = `${apiUrl}?key=${selectedApiKey}`;

        // 3. TERUSKAN PERMINTAAN KE GOOGLE
        console.log(`[LOG] Meneruskan permintaan ke Google AI...`);
        const response = await fetch(urlWithKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data.error ? data.error.message : 'Terjadi kesalahan tidak diketahui dari Google AI.';
            // LOGGING: Catat error dari Google
            console.error(`[ERROR] Google AI merespons dengan status ${response.status}: ${errorMessage}`);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: errorMessage }),
            };
        }

        console.log("[LOG] Permintaan berhasil! Mengirim hasil kembali ke aplikasi.");
        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };

    } catch (error) {
        console.error('Error in Netlify function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};

