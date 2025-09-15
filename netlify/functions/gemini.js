const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // Hanya izinkan metode POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { apiUrl, payload } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY;

        // Validasi: Pastikan API Key ada di server
        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'GEMINI_API_KEY tidak diatur di server Netlify.' })
            };
        }
        
        // Validasi: Pastikan apiUrl dan payload ada
        if (!apiUrl || !payload) {
             return {
                statusCode: 400,
                body: JSON.stringify({ error: 'apiUrl dan payload dibutuhkan.' })
            };
        }

        // Tambahkan query parameter API key ke URL
        const urlWithKey = `${apiUrl}?key=${apiKey}`;

        // Teruskan permintaan ke Google AI
        const response = await fetch(urlWithKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // Jika respons dari Google adalah error, teruskan error tersebut
        if (!response.ok) {
            console.error('Google AI API Error:', data);
            return {
                statusCode: response.status,
                body: JSON.stringify(data)
            };
        }
        
        // Jika berhasil, kirim kembali hasilnya ke aplikasi Anda
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

