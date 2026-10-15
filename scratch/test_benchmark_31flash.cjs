const https = require('https');
const fs = require('fs');

const env = fs.readFileSync('c:/Users/12pon/Desktop/GitClone/IGOTYOU/.env.local', 'utf8');
const key = env.match(/VITE_GEMINI_API_KEY=(\S+)/)[1].trim();

const img1Path = 'C:/Users/12pon/.gemini/antigravity/brain/7c5c82ab-030b-421a-9e90-ffdf35bbbe14/.user_uploaded/media_1791972663291_a13fa90f.png';
const img2Path = 'C:/Users/12pon/.gemini/antigravity/brain/7c5c82ab-030b-421a-9e90-ffdf35bbbe14/.user_uploaded/media_1791972663285_8e1be2d5.png';

const base64Img1 = fs.readFileSync(img1Path).toString('base64');
const base64Img2 = fs.readFileSync(img2Path).toString('base64');

async function benchmark() {
  const prompt = `You are IGOTYOU, an engaging Instagram profile & aesthetic visual analyzer.
Analyze these two Instagram screenshots (one shows the profile header/bio, one shows the post grid).

CRITICAL TASKS:
1. Extract the exact username (@p.spn_).
2. Extract exact follower/following/post counts from the header screenshot (2 posts, 486 followers, 432 following). Calculate follower/following ratio (~1.1x).
3. Read the bio: "Artist", "KMITL | intp", and website link "contact-me.plazedez.online".
4. Analyze the post grid: Note that there are only 2 posts!
   - Post 1: Boy sitting on park bench under pine tree in front of stone wall (black shirt/shorts).
   - Post 2: Boy in black hoodie and blue jeans in front of traditional Chinese red wooden door with Fu character (福).
   - Right side is empty dark space.
5. Identify the normalized bounding boxes [ymin, xmin, ymax, xmax] (0 to 1000) for the actual photo areas:
   - "post_grid": the bounding box containing the 2 photos in the post grid (e.g. ymin around 150 to 950, xmin 0 to 660, excluding the empty black space on the right!).
   - "avatar": the circular profile picture.
6. Persona title in Thai: Create a witty, cool persona title reflecting KMITL, Artist, INTP, street/film mood (e.g. "ศิลปินเด็กสถาปัตย์ · INTP สตรีทฟิล์ม", "KMITL Night Owl", "มู้ดฟิล์มสตรีทเอเชีย") with 2-3 relevant tags.
7. Aesthetic score (70-98/100) based on visual curation, with a supportive verdict and 1 sentence critique.
8. Top 3 content topics in Thai (e.g. สตรีทเอเชีย · อาร์ต & ดีไซน์ · บรรยากาศกลางคืน).
9. A witty, aesthetic 1-line English bio remix with a Thai/English subtext.
10. Weights breakdown for color harmony, composition, contrast.

Return ONLY valid JSON matching this exact structure:
{
  "username": "@p.spn_",
  "detectedBoxes": [
    { "ymin": 150, "xmin": 0, "ymax": 950, "xmax": 660, "label": "post_grid" },
    { "ymin": 90, "xmin": 50, "ymax": 350, "xmax": 280, "label": "avatar" }
  ],
  "persona": { "title": "...", "description": "ฉายาประจำโปรไฟล์ของคุณคือ", "tags": ["tag1", "tag2"] },
  "aestheticScore": { "score": 90, "verdict": "...", "description": "..." },
  "stats": { "followerRatio": "1.1×", "postDensity": "2", "ocrNote": "..." },
  "topContent": { "category": "TOP CONTENT", "description": "..." },
  "bioRemix": { "text": "...", "subtext": "..." },
  "ethicsAudit": {
    "weights": { "colorHarmony": 45, "composition": 35, "contrast": 20 },
    "detectedBiases": ["Western Minimalist Bias disclosure", "Socio-economic filter note"],
    "transparencyNote": "..."
  }
}`;

  const postData = JSON.stringify({
    contents: [{
      parts: [
        { text: prompt },
        { inlineData: { mimeType: 'image/png', data: base64Img1 } },
        { inlineData: { mimeType: 'image/png', data: base64Img2 } }
      ]
    }],
    generationConfig: {
      responseMimeType: 'application/json'
    }
  });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${key}`,
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
      console.log('gemini-3.1-flash-lite Status:', res.statusCode);
      try {
        const parsed = JSON.parse(data);
        if (parsed.candidates) {
          console.log("BENCHMARK SUCCESS! RESPONSE:\n");
          console.log(parsed.candidates[0].content.parts[0].text);
        } else {
          console.log("Error response:", data);
        }
      } catch(e) {
        console.error("Parse error:", e.message, data);
      }
    });
  });

  req.on('error', (e) => console.error("Req error:", e));
  req.write(postData);
  req.end();
}

benchmark();

