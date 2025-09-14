// Netlify Function (gemini.js) - Versi 2
// Menggunakan 'require' untuk kompatibilitas yang lebih baik.

// Kita import 'node-fetch' yang akan di-install oleh Netlify
const fetch = require('node-fetch');

exports.handler = async (event) => {
  // 1. Cek apakah metode request adalah POST.
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405, // Method Not Allowed
      body: JSON.stringify({ error: 'Hanya metode POST yang diizinkan' }),
    };
  }

  // 2. Ambil API Key Gemini dari environment variables.
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API Key Gemini belum diatur di server.' }),
    };
  }

  try {
    // 3. Ambil data (payload) dari frontend.
    const requestBody = JSON.parse(event.body);
    const { apiUrl, payload } = requestBody;

    if (!apiUrl || !payload) {
        return {
            statusCode: 400, // Bad Request
            body: JSON.stringify({ error: 'apiUrl dan payload dibutuhkan.' }),
        };
    }

    // 4. Lakukan pemanggilan ke API Google Gemini yang sebenarnya.
    const response = await fetch(`${apiUrl}?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // 5. Tangani jika respons dari Google tidak berhasil.
    if (!response.ok) {
      const errorBody = await response.json();
      console.error('Google API Error:', errorBody);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Error dari Google AI: ${errorBody.error?.message || 'Unknown error'}` }),
      };
    }

    // 6. Ambil data JSON dari respons Google.
    const data = await response.json();

    // 7. Kirim kembali data ke frontend.
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };

  } catch (error) {
    // 8. Tangani error lainnya.
    console.error('Internal Server Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Terjadi kesalahan internal pada server.' }),
    };
  }
};
