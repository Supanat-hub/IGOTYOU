const https = require('https');
const fs = require('fs');

const env = fs.readFileSync('c:/Users/12pon/Desktop/GitClone/IGOTYOU/.env.local', 'utf8');
const key = env.match(/VITE_GEMINI_API_KEY=(\S+)/)[1].trim();

const img1Path = 'C:/Users/12pon/.gemini/antigravity/brain/7c5c82ab-030b-421a-9e90-ffdf35bbbe14/.user_uploaded/media_1791972663291_a13fa90f.png';
const img2Path = 'C:/Users/12pon/.gemini/antigravity/brain/7c5c82ab-030b-421a-9e90-ffdf35bbbe14/.user_uploaded/media_1791972663285_8e1be2d5.png';

const base64Img1 = fs.readFileSync(img1Path).toString('base64');
const base64Img2 = fs.readFileSync(img2Path).toString('base64');

const candidateModels = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];

function tryModel(model) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      contents: [{
        parts: [
          { text: "Analyze these 2 screenshots. Extract username, bio, and 2 tags in JSON." },
          { inlineData: { mimeType: 'image/png', data: base64Img1 } },
          { inlineData: { mimeType: 'image/png', data: base64Img2 } }
        ]
      }],
      generationConfig: { responseMimeType: 'application/json' }
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
        if (res.statusCode === 200) {
          resolve({ ok: true, model, data: JSON.parse(data) });
        } else {
          resolve({ ok: false, model, status: res.statusCode });
        }
      });
    });

    req.setTimeout(8000, () => {
      req.destroy();
      resolve({ ok: false, model, status: 'TIMEOUT' });
    });

    req.on('error', () => resolve({ ok: false, model, status: 'ERR' }));
    req.write(postData);
    req.end();
  });
}

async function testCascade() {
  console.log("Testing Cascade from 3.8 down to 3.1:");
  for (const model of candidateModels) {
    process.stdout.write(`Attempting ${model}... `);
    const res = await tryModel(model);
    if (res.ok) {
      console.log(`✅ SUCCESS on ${model}!`);
      console.log(res.data.candidates[0].content.parts[0].text);
      return;
    } else {
      console.log(`❌ ${res.status}`);
    }
  }
}

testCascade();

