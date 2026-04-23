import Groq from 'groq-sdk';

export async function POST(request) {
  try {
    const { transcript, apiKey, prompt, contextWindow } = await request.json();

    if (!transcript || !apiKey) {
      return Response.json({ error: 'Missing transcript or API key' }, { status: 400 });
    }

    const groq = new Groq({ apiKey });

    const excerpt = transcript.slice(-contextWindow || -800);

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      temperature: 0.7,
      max_tokens: 1200,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: `RECENT MEETING TRANSCRIPT:\n\n${excerpt}\n\n---\nGenerate 3 suggestions for this meeting.` }
      ]
    });

    const raw = completion.choices[0].message.content;
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return Response.json({ suggestions: parsed.suggestions });
  } catch (error) {
    console.error('Suggestions error:', error);
    if (error.message?.includes('429')) {
      return Response.json({ error: 'Rate limit hit — please wait a moment' }, { status: 429 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}
