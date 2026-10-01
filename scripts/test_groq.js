import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function test() {
  const GROQ_API_KEY = process.env.VITE_GROQ_API_KEY;
  console.log("Using key:", GROQ_API_KEY.substring(0, 10) + '...');
  
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: 'Output JSON: {"is_correct": true, "feedback": "good"}' },
          { role: 'user', content: 'test' }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      })
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
