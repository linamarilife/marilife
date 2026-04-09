import { NextRequest, NextResponse } from 'next/server';

// ElevenLabs configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'ca450d039e70f58955b8ffd243249352eab3df55d0dd873835f8af322e201b2a'; // from openclaw config
const VOICE_ID = 'wutgczPT1RZgTX0H3qRJ'; // Vanessa
const MODEL_ID = 'eleven_flash_v2_5';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const text = searchParams.get('text');
  const lang = searchParams.get('lang') || 'es';

  if (!text) {
    return NextResponse.json({ error: 'Missing text parameter' }, { status: 400 });
  }

  try {
    // Call ElevenLabs TTS API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: MODEL_ID,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0,
            use_speaker_boost: true,
            speed: 1,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs TTS error:', response.status, error);
      return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 });
    }

    // Get audio buffer
    const audioBuffer = await response.arrayBuffer();

    // Return audio response
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('TTS endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}