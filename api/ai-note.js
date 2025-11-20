// api/ai-note.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { content } = req.body || {};

  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Missing note content' });
  }

  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // SECRET stays on server
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // or another Groq-supported model
        messages: [
          {
            role: 'system',
            content:
              'You analyze short personal notes and return a concise summary, 3–6 tags, and an overall mood (like happy, stressed, neutral, excited, sad). Always respond in strict JSON.'
          },
          {
            role: 'user',
            content: `Note:\n\n${content}\n\nReturn JSON like:
{
  "summary": "...",
  "tags": ["tag1","tag2"],
  "mood": "happy"
}`
          }
        ],
        temperature: 0.4,
      }),
    });

    if (!groqResponse.ok) {
      const text = await groqResponse.text();
      console.error('Groq API error:', text);
      return res.status(500).json({ error: 'AI request failed' });
    }

    const data = await groqResponse.json();
    const aiText = data.choices?.[0]?.message?.content?.trim();

    let result;
    try {
      result = JSON.parse(aiText);
    } catch (e) {
      // If the model returns non-JSON, fallback safely
      console.error('Failed to parse AI JSON:', aiText);
      result = {
        summary: aiText || 'No summary available.',
        tags: [],
        mood: 'unknown',
      };
    }

    return res.status(200).json({
      summary: result.summary || '',
      tags: Array.isArray(result.tags) ? result.tags : [],
      mood: result.mood || 'unknown',
    });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
