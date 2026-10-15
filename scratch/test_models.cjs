const https = require('https');
const fs = require('fs');

const env = fs.readFileSync('c:/Users/12pon/Desktop/GitClone/IGOTYOU/.env.local', 'utf8');
const key = env.match(/VITE_GEMINI_API_KEY=(\S+)/)[1].trim();

function test(model) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      contents: [{ parts: [{ text: "ping" }] }]
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
        console.log(model, 'status:', res.statusCode);
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) console.log(model, 'error:', parsed.error.message);
          else if (parsed.candidates) console.log(model, 'OK! response:', parsed.candidates[0].content.parts[0].text.trim());
        } catch(e) {
          console.log(model, 'raw:', data.slice(0, 100));
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log(model, 'req error:', e.message);
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

async function run() {
  const models = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest'
  ];
  for (const m of models) {
    await test(m);
  }
}

run();

