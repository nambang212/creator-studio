const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { apiUrl, payload } = JSON.parse(event.body);

        // --- Logika Rotasi Kunci API ---
        const apiKeys = Object.keys(process.env)
            .filter(key => key.startsWith('GEMINI_API_KEY_'))
            .map(key => process.env[key]);

        if (apiKeys.length === 0) {
            return { statusCode: 500, body: JSON.stringify({ error: 'Tidak ada GEMINI_API_KEY_[N] yang ditemukan di server.' }) };
        }

        // Pilih kunci secara acak untuk setiap permintaan
        const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
        // --- Akhir Logika Rotasi ---

        if (!apiUrl || !payload) {
             return { statusCode: 400, body: JSON.stringify({ error: 'apiUrl dan payload dibutuhkan.' }) };
        }

        const urlWithKey = `${apiUrl}?key=${apiKey}`;

        const response = await fetch(urlWithKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        
        const data = await response.json();

        if (!response.ok) {
            console.error('Google AI API Error:', data);
            return { statusCode: response.status, body: JSON.stringify(data) };
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Server function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Terjadi kesalahan internal pada server.' })
        };
    }
};

