import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function test(modelName) {
  const GROQ_API_KEY = process.env.VITE_GROQ_API_KEY;
  console.log("Testing:", modelName);
  
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: 'Say hello in JSON {"hello":"world"}' }],
        response_format: { type: "json_object" }
      })
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text.substring(0, 200));
  } catch (err) {
    console.error("Error:", err);
  }
}

test('mixtral-8x7b-32768');
test('llama3-70b-8192');
test('llama-3.3-70b-versatile');
