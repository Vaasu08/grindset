const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export const evaluateIntuition = async (problemTitle, problemContent, userIntuition, isPreCode) => {
  if (!GROQ_API_KEY || GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
    return {
      status: 'error',
      message: 'Groq API Key is missing. Please add it to .env.local.'
    };
  }

  const phase = isPreCode ? "Initial Approach / Intuition (Before Coding)" : "Final Reflection (After Solving)";
  
  const systemPrompt = `You are a strict, elite technical interviewer evaluating a candidate's ${phase} for a LeetCode problem.
Your goal is to tell the user if their intuition/insight is correct, fundamentally flawed, or missing key complexity considerations.
Keep your response extremely concise, direct, and under 3-4 sentences. 
Do NOT give them the code. If they are wrong, give them a subtle hint in the right direction.
If they are right, praise them briefly and confirm the time/space complexity.
Output a JSON object with two fields:
{
  "is_correct": boolean, // true if their intuition is mostly right/on-track, false if completely wrong
  "feedback": "string" // your concise feedback
}`;

  const userMessage = `Problem: ${problemTitle}
Description: ${problemContent}
User's ${phase}: ${userIntuition}

Evaluate this strictly.`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b', // User's custom API key model access
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 300
      })
    });

    const data = await res.json();
    
    if (!res.ok) {
      console.error("Groq API Response Error:", data);
      throw new Error(data.error?.message || `Groq API Error: ${res.statusText}`);
    }

    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error("Groq Evaluation Error:", error);
    return {
      status: 'error',
      message: `Groq Error: ${error.message}`
    };
  }
};
