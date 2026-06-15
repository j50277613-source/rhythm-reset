export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POST 요청만 가능합니다.' });
  }

  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: '프롬프트가 없습니다.' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY 환경변수가 설정되지 않았습니다.' });
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        input: prompt,
        temperature: 0.35,
        max_output_tokens: 1400
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || 'OpenAI API 요청에 실패했습니다.'
      });
    }

    const text = data.output_text ||
      (Array.isArray(data.output)
        ? data.output.flatMap(item => item.content || []).map(c => c.text || '').join('\n').trim()
        : '');

    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({ error: error?.message || '알 수 없는 오류가 발생했습니다.' });
  }
}
