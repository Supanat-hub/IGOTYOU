const https = require('https');
const fs = require('fs');

const env = fs.readFileSync('c:/Users/12pon/Desktop/GitClone/IGOTYOU/.env.local', 'utf8');
const key = env.match(/VITE_GEMINI_API_KEY=(\S+)/)[1].trim();

function testModel(model) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      contents: [{ parts: [{ text: "Hello, reply with one word." }] }]
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
        console.log(model, res.statusCode);
        if (res.statusCode === 200) {
          const p = JSON.parse(data);
          console.log(model, "->", p.candidates?.[0]?.content?.parts?.[0]?.text);
        } else {
          try {
            console.log(model, "error:", JSON.parse(data).error?.message);
          } catch(e) {}
        }
        resolve();
      });
    });

    req.on('error', () => resolve());
    req.write(postData);
    req.end();
  });
}

async function run() {
  const models = [
    'gemini-3.1-flash-lite',
    'gemini-3.1-pro-preview',
    'gemini-2.5-pro',
    'gemini-3.5-flash'
  ];
  for (const m of models) {
    await testModel(m);
  }
}

run();

