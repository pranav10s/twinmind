import Groq from 'groq-sdk';

export async function POST(request) {
  try {
    const { messages, apiKey, prompt, transcript } = await request.json();

    if (!messages || !apiKey) {
      return Response.json({ error: 'Missing messages or API key' }, { status: 400 });
    }

    const groq = new Groq({ apiKey });

    const systemPrompt = prompt + (transcript
      ? `\n\nMEETING TRANSCRIPT SO FAR:\n${transcript}`
      : '\n\n(No transcript available yet — answer from general knowledge.)');

    const stream = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      temperature: 0.7,
      max_tokens: 1200,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content || '';
          if (token) {
            controller.enqueue(encoder.encode(token));
          }
        }
        controller.close();
      }
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });

  } catch (error) {
    console.error('Chat error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
