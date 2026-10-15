const https = require('https');
const fs = require('fs');

const env = fs.readFileSync('c:/Users/12pon/Desktop/GitClone/IGOTYOU/.env.local', 'utf8');
const key = env.match(/VITE_GEMINI_API_KEY=(\S+)/)[1].trim();

const imgPath = 'C:/Users/12pon/.gemini/antigravity/brain/7c5c82ab-030b-421a-9e90-ffdf35bbbe14/.user_uploaded/media_1791972663291_a13fa90f.png';
const base64Img = fs.readFileSync(imgPath).toString('base64');

function testModel(modelName) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      contents: [{
        parts: [
          { text: "Ping. Reply with OK." },
          { inlineData: { mimeType: "image/png", data: base64Img } }
        ]
      }]
    });

    const start = Date.now();
    let timedOut = false;

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/${modelName}:generateContent?key=${key}`,
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
        if (timedOut) return;
        const duration = Date.now() - start;
        let note = '';
        try {
          const p = JSON.parse(data);
          if (p.error) {
            note = p.error.message.split('.')[0];
          } else if (p.candidates) {
            note = p.candidates[0].content.parts[0].text.trim().replace(/\n/g, ' ');
          }
        } catch (e) {
          note = 'Failed parsing response';
        }
        resolve({
          model: modelName,
          status: res.statusCode,
          duration,
          note
        });
      });
    });

    req.setTimeout(8000, () => {
      timedOut = true;
      req.destroy();
      resolve({
        model: modelName,
        status: 'TIMEOUT (8s)',
        duration: 8000,
        note: 'Request timed out'
      });
    });

    req.on('error', (err) => {
      if (!timedOut) {
        resolve({
          model: modelName,
          status: 'ERR',
          duration: Date.now() - start,
          note: err.message
        });
      }
    });

    req.write(postData);
    req.end();
  });
}

async function run() {
  const candidates = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.1-pro-preview',
    'gemini-flash-latest'
  ];

  console.log('Testing Multimodal Vision in parallel across all versions:\n');
  const results = await Promise.all(candidates.map(m => testModel(m)));

  for (const res of results) {
    const icon = res.status === 200 ? '✅' : '❌';
    console.log(`${icon} ${res.model.padEnd(25)} => Status ${res.status} (${res.duration}ms) - ${res.note}`);
  }

  const working = results.filter(r => r.status === 200);
  console.log('\n--- SCAN SUMMARY ---');
  console.log('Available working models (200 OK):', working.map(r => r.model));
}

run();

