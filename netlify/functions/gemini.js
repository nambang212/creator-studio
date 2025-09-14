// Menggunakan node-fetch untuk melakukan panggilan HTTP di lingkungan Node.js
const fetch = require('node-fetch');

// Handler utama untuk Netlify Function
exports.handler = async (event) => {
    // Hanya izinkan metode POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Ambil semua variabel lingkungan (environment variables) dari Netlify
        const envVars = process.env;

        // 1. TEMUKAN SEMUA KUNCI API
        // Kita cari semua variabel yang namanya dimulai dengan 'GEMINI_API_KEY_'
        const apiKeys = Object.keys(envVars)
            .filter(key => key.startsWith('GEMINI_API_KEY_'))
            .map(key => envVars[key]);

        // Jika tidak ada kunci yang ditemukan, kirim pesan error yang jelas
        if (apiKeys.length === 0) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Tidak ada GEMINI_API_KEY yang ditemukan di pengaturan Netlify.' }),
            };
        }

        // 2. PILIH SATU KUNCI SECARA ACAK
        // Ini adalah inti dari strategi rotasi. Setiap permintaan akan menggunakan kunci yang berbeda.
        const selectedApiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

        // Ambil payload asli dan URL tujuan dari permintaan yang dikirim oleh aplikasi utama
        const { apiUrl, payload } = JSON.parse(event.body);

        // Jika URL tujuan tidak ada, kirim error
        if (!apiUrl || !payload) {
             return { statusCode: 400, body: JSON.stringify({ error: 'apiUrl dan payload dibutuhkan.' }) };
        }
        
        // Tambahkan "?key=" dan kunci API yang terpilih ke URL tujuan
        const urlWithKey = `${apiUrl}?key=${selectedApiKey}`;

        // 3. TERUSKAN PERMINTAAN KE GOOGLE
        // Lakukan panggilan ke Google AI menggunakan kunci yang sudah dipilih secara acak
        const response = await fetch(urlWithKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        // Ambil data respons dari Google
        const data = await response.json();

        // Jika Google merespons dengan error (misalnya kuota habis untuk kunci INI)
        if (!response.ok) {
            // Kita teruskan pesan error dari Google ke pengguna agar mereka tahu apa yang terjadi
            const errorMessage = data.error ? data.error.message : 'Terjadi kesalahan tidak diketahui dari Google AI.';
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: errorMessage }),
            };
        }

        // Jika semua berhasil, kirim kembali hasil dari Google ke aplikasi utama
        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };

    } catch (error) {
        // Tangani error jika ada masalah dalam proses
        console.error('Error in Netlify function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};

