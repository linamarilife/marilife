import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { callSessionManager } from '@/lib/callSession';
import { extractLeadInfo } from '@/lib/lina';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const speechResult = formData.get('SpeechResult') as string | null;
  const callSid = formData.get('CallSid') as string | null;
  const callerNumber = formData.get('Caller') as string | null;
  const fromNumber = formData.get('From') as string | null;
  
  const phone = callerNumber || fromNumber;
  
  console.log('Capture phone:', { speechResult, callSid, phone });

  const twiml = new twilio.twiml.VoiceResponse();
  const host = request.headers.get('host') || 'pseudoprostyle-nonepisodical-zaid.ngrok-free.dev';
  const origin = `https://${host}`;

  if (!callSid) {
    twiml.redirect(`${origin}/api/voice`);
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Extraer información del speech
  let phoneDigits = '';
  let extractedName: string | undefined;
  let extractedEmail: string | undefined;
  
  if (speechResult) {
    const extracted = extractLeadInfo(speechResult);
    phoneDigits = extracted.phone || speechResult.replace(/\D/g, '');
    extractedName = extracted.name;
    extractedEmail = extracted.email;
  } else {
    phoneDigits = '';
  }
  
  if (phoneDigits.length < 10) {
    // No se capturó teléfono válido
    const askPhoneUrl = `${origin}/api/tts?text=${encodeURIComponent('No entendí un número válido. Por favor, dígalo nuevamente, incluyendo el código de área.')}&lang=es`;
    twiml.play(askPhoneUrl);
    
    const gather = twiml.gather({
      input: ['speech'],
      language: 'es-ES',
      speechTimeout: 'auto',
      action: `${origin}/api/voice/capture-phone`,
      method: 'POST',
    });
    
    twiml.pause({ length: 10 });
    twiml.redirect(`${origin}/api/voice`);
    
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Crear o actualizar sesión con el teléfono
  const existingSession = callSessionManager.getSession(callSid);
  if (!existingSession) {
    callSessionManager.createSession(callSid, phoneDigits);
  } else {
    callSessionManager.updateSession(callSid, { phone: phoneDigits });
  }
  
  // También extraer nombre si está presente
  if (extractedName) {
    callSessionManager.updateSession(callSid, { name: extractedName });
  }
  if (extractedEmail) {
    callSessionManager.updateSession(callSid, { email: extractedEmail });
  }

  // Redirigir al flujo completo de captura de lead
  twiml.redirect(`${origin}/api/voice/capture-lead`);

  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}