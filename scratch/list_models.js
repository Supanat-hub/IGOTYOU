const fs = require('fs');
const path = require('path');

const envPath = path.resolve('c:/Users/12pon/Desktop/GitClone/IGOTYOU/.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/VITE_GEMINI_API_KEY=(\S+)/);
const apiKey = match ? match[1] : '';

async function checkModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.models) {
    console.log("Available models:");
    const names = data.models
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => m.name);
    console.log(names);
  } else {
    console.log(data);
  }
}

checkModels();

