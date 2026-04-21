import Groq from 'groq-sdk';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio');
    const apiKey = formData.get('apiKey');

    if (!audio || !apiKey) {
      return Response.json({ error: 'Missing audio or API key' }, { status: 400 });
    }

    const groq = new Groq({ apiKey });

    const file = new File([audio], 'audio.wav', { type: 'audio/wav' });

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3',
      response_format: 'text',
    });

    return Response.json({ text: transcription });
  } catch (error) {
    console.error('Transcription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}