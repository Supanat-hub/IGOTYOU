const fs = require('fs');
const path = require('path');

async function testProxy() {
  const imgPath = 'C:\\Users\\12pon\\.gemini\\antigravity\\brain\\7c5c82ab-030b-421a-9e90-ffdf35bbbe14\\.user_uploaded\\media_1791972663285_8e1be2d5.png';
  const imgBuffer = fs.readFileSync(imgPath);
  const base64Data = imgBuffer.toString('base64');

  const payload = {
    prompt: `You are IGOTYOU. Extract exact username (@username) and persona title from this profile screenshot. Return valid JSON { "username": "@...", "persona": { "title": "..." } }`,
    images: [{ mimeType: 'image/png', data: base64Data }]
  };

  console.log("Sending POST to http://localhost:5173/api/analyze...");
  const t0 = Date.now();
  try {
    const res = await fetch('http://localhost:5173/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log(`HTTP Status: ${res.status} (${Date.now() - t0}ms)`);
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

testProxy();

