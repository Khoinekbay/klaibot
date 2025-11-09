import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

const GEMINI_API_URL = process.env.GEMINI_API_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_URL || !GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_URL or GEMINI_API_KEY not set in env.');
}

app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, mode, topic } = req.body;
    if (!prompt) return res.status(400).send('Missing prompt');

    let systemInstruction = (mode === 'teacher')
      ? 'Bạn là một trợ lý AI cho giáo viên. Khi nhận nội dung, hãy sinh đề/đáp án/lời giải với phong cách chuyên nghiệp, chi tiết.'
      : 'Bạn là trợ lý học tập thân thiện cho học sinh. Giải thích dễ hiểu, từng bước, có ví dụ ngắn.';

    // Construct payload for Gemini-like API - edit to match your provider
    const apiPayload = {
      model: 'gemini',
      prompt: `${systemInstruction}\nChủ đề: ${topic}\nYêu cầu: ${prompt}`,
      max_tokens: 800
    };

    const r = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_API_KEY}`
      },
      body: JSON.stringify(apiPayload)
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('Gemini error', r.status, text);
      return res.status(500).send('Error from Gemini: ' + text);
    }

    const j = await r.json();
    let reply = j.reply || j.output?.text || j.choices?.[0]?.text || JSON.stringify(j);
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error: ' + (err.message || err));
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
