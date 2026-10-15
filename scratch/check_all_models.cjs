const https = require('https');
const fs = require('fs');

const env = fs.readFileSync('c:/Users/12pon/Desktop/GitClone/IGOTYOU/.env.local', 'utf8');
const key = env.match(/VITE_GEMINI_API_KEY=(\S+)/)[1].trim();

function checkModel(model) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      contents: [{ parts: [{ text: "hi" }] }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/${model}:generateContent?key=${key}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let ok = res.statusCode === 200;
        let msg = '';
        try {
          const p = JSON.parse(data);
          if (p.error) msg = p.error.message;
        } catch(e) {}
        console.log(`Model: ${model.padEnd(30)} => ${res.statusCode} ${ok ? '✅ OK' : '❌ ' + msg}`);
        resolve({ model, ok, status: res.statusCode });
      });
    });

    req.on('error', (e) => {
      console.log(`Model: ${model.padEnd(30)} => Error: ${e.message}`);
      resolve({ model, ok: false });
    });

    req.write(postData);
    req.end();
  });
}

async function run() {
  const candidates = [
    'gemini-2.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-2.5-pro',
    'gemini-3.1-pro-preview'
  ];

  for (const m of candidates) {
    await checkModel(m);
  }
}

run();

