import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Initialize Twilio client (optional for this endpoint, but useful later)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // For testing: return a simple TwiML response
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say(
    {
      voice: 'woman',
      language: 'es-ES',
    },
    'Hola, soy Lina, su asistente de seguros médicos y taxes en la Florida. ¿En qué puedo ayudarle?'
  );
  twiml.hangup();

  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}

export async function POST(request: NextRequest) {
  // Log the incoming request from Twilio
  const host = request.headers.get('host');
  const userAgent = request.headers.get('user-agent');
  const callSid = request.headers.get('x-twilio-callsid');
  console.log('Twilio POST to /api/voice:', { host, userAgent, callSid, url: request.url });
  
  // Twilio will send a POST request when a call comes in
  const twiml = new twilio.twiml.VoiceResponse();
  // Determine public origin from the Host header (ngrok forwards it)
  const origin = `https://${host || 'pseudoprostyle-nonepisodical-zaid.ngrok-free.dev'}`;
  
  // Greet the caller with pre‑generated ElevenLabs audio (voice Vanessa)
  twiml.play(`${origin}/audio/saludo.mp3`);
  
  // Gather speech input from the caller
  const gather = twiml.gather({
    input: ['speech'],
    language: 'es-ES',
    speechTimeout: '5', // 5 segundos de silencio antes de considerar que terminó
    action: '/api/voice/process', // endpoint that will handle the speech result
    method: 'POST',
    bargeIn: true, // Permite que el usuario interrumpa el audio
    hints: 'seguros, taxes, medicare, obamacare, citas, ayuda',
  });
  gather.play(`${origin}/audio/instruccion.mp3`);
  
  // If no speech is detected, repeat
  twiml.redirect('/api/voice');

  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}