import Groq from 'groq-sdk';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio');
    const apiKey = formData.get('apiKey');

    if (!audio || !apiKey) {
      return Response.json({ error: 'Missing audio or API key' }, { status: 400 });
    }

    const arrayBuffer = await audio.arrayBuffer();
    
    if (arrayBuffer.byteLength < 1000) {
      return Response.json({ text: '' });
    }

    const groq = new Groq({ apiKey });
    const file = new File([arrayBuffer], 'audio.webm', { type: 'audio/webm' });

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3-turbo',
      response_format: 'text',
      language: 'en',
    });

    return Response.json({ text: transcription });
  } catch (error) {
    console.error('Transcription error:', error);
    return Response.json({ text: '' });
  }
}
