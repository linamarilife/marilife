import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { generateLinaResponse, extractLeadInfo } from '@/lib/lina';
import { prisma } from '@/lib/db';
import { callSessionManager } from '@/lib/callSession';
import { sendLeadNotificationEmail } from '@/lib/email';
import { conversationLogger } from '@/lib/conversationLogger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const speechResult = formData.get('SpeechResult') as string | null;
  const callSid = formData.get('CallSid') as string | null;
  const callerNumber = formData.get('Caller') as string | null;
  const fromNumber = formData.get('From') as string | null;
  
  // Usar Caller o From
  const phone = callerNumber || fromNumber;
  
  console.log('Voice process:', { speechResult, callSid, phone });

  const twiml = new twilio.twiml.VoiceResponse();

  if (!speechResult) {
    // No speech detected, ask again
    twiml.say(
      { voice: 'woman', language: 'es-ES' },
      'No te escuché. Por favor, dime cómo puedo ayudarte.'
    );
    twiml.redirect('/api/voice');
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Crear o actualizar sesión de llamada
  if (callSid) {
    const phoneDigits = phone ? phone.replace(/\D/g, '') : null;
    
    if (phoneDigits) {
      // Si hay teléfono, crear o actualizar sesión
      const existingSession = callSessionManager.getSession(callSid);
      if (!existingSession) {
        callSessionManager.createSession(callSid, phoneDigits);
      }
      
      // Extraer información del speech
      const extracted = extractLeadInfo(speechResult || '');
      const session = callSessionManager.getSession(callSid);
      
      if (session) {
        const updates: any = {};
        if (extracted.name && !session.name) updates.name = extracted.name;
        if (extracted.email && !session.email) updates.email = extracted.email;
        if (extracted.phone && !session.phone) updates.phone = extracted.phone;
        
        if (Object.keys(updates).length > 0) {
          callSessionManager.updateSession(callSid, updates);
        }
      }
    }
  }

  // Generar respuesta usando Lina
  console.log('Generating Lina response for:', speechResult);
  const linaResponse = generateLinaResponse(speechResult);
  console.log('Lina response:', linaResponse);
  
  // Variable para trackear si se capturó lead
  let leadCaptured = false;
  let leadData: any = null;
  
  // Determinar URL base para el audio TTS
  const host = request.headers.get('host') || 'pseudoprostyle-nonepisodical-zaid.ngrok-free.dev';
  const origin = `https://${host}`;
  
  // URL del endpoint TTS con la respuesta generada
  const ttsUrl = `${origin}/api/tts?text=${encodeURIComponent(linaResponse.text)}&lang=es`;
  
  // Reproducir audio generado por ElevenLabs (voz Vanessa)
  twiml.play(ttsUrl);
  
  // Si la respuesta sugiere agendar cita o necesita humano
  const isInfoQuery = speechResult.toLowerCase().includes('información') || speechResult.toLowerCase().includes('informacion') || speechResult.toLowerCase().includes('informar');
  const shouldCaptureLead = (linaResponse.appointmentPrompt || linaResponse.needsHuman) && !isInfoQuery;
  if (shouldCaptureLead) {
    // Verificar si ya tenemos sesión con datos suficientes
    const session = callSid ? callSessionManager.getSession(callSid) : null;
    
    if (session && session.phone && session.name) {
      // Ya tenemos datos básicos, crear lead completo
      try {
        const lead = await prisma.lead.create({
          data: {
            name: session.name,
            email: session.email || `caller-${callSid}@marilife.com`,
            phone: session.phone,
            age: 0,
            income: 0,
            householdSize: 0,
            zipCode: '00000',
            tobaccoUse: false,
            estimatedPremium: 0,
            estimatedSubsidy: 0,
            planTier: 'Unknown',
            notes: `Lead desde llamada: ${speechResult?.substring(0, 200) || 'sin texto'}`, 
          },
        });
        
        // Marcar lead como capturado
        leadCaptured = true;
        leadData = lead;
        
        // Enviar email a Mariela
        await sendLeadNotificationEmail(lead).catch(err => 
          console.error('Error enviando email:', err)
        );
        
        console.log('Lead creado y email enviado:', lead.id);
        
        // Confirmar al usuario
        const confirmUrl = `${origin}/api/tts?text=${encodeURIComponent(`Perfecto ${session.name}. Hemos registrado tu solicitud. Nuestra especialista te contactará pronto al ${session.phone}.`)}&lang=es`;
        twiml.play(confirmUrl);
        
        // Eliminar sesión
        if (callSid) callSessionManager.deleteSession(callSid);
        
      } catch (error) {
        console.error('Error creando lead:', error);
      }
    } else {
      // No tenemos datos suficientes, redirigir al flujo de captura de lead
      twiml.redirect(`${origin}/api/voice/capture-lead`);
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' },
      });
    }
  }
  
  // Si no es una despedida, permitir que el usuario continúe la conversación
  if (!linaResponse.text.includes('Gracias a ti') && !linaResponse.text.includes('excelente día')) {
    // Gather inmediatamente después del audio - sin pausa
    const gather = twiml.gather({
      input: ['speech'],
      language: 'es-ES',
      speechTimeout: '5', // Segundos de silencio antes de considerar que terminó de hablar
      action: `${origin}/api/voice/process`,
      method: 'POST',
      hints: 'seguros, taxes, medicare, obamacare, citas, precios, ayuda',
      bargeIn: true, // Permite que el usuario interrumpa el audio (si todavía se reproduce)
    });
    
    // Si no hay respuesta en 8 segundos, colgar silenciosamente
    twiml.pause({ length: 8 });
    twiml.hangup();
  }

  // Registrar conversación asíncronamente (no bloquea la respuesta)
  (async () => {
    try {
      const session = callSid ? callSessionManager.getSession(callSid) : null;
      
      await conversationLogger.logConversation({
        timestamp: new Date().toISOString(),
        callSid: callSid || 'unknown',
        phone: phone || 'unknown',
        speech: speechResult || '',
        linaResponse: {
          text: linaResponse.text,
          intent: linaResponse.intent,
          needsHuman: linaResponse.needsHuman,
          appointmentPrompt: linaResponse.appointmentPrompt || false,
        },
        sessionData: {
          name: session?.name,
          email: session?.email,
          captured: leadCaptured,
        },
      });
      
      console.log('Conversación registrada para análisis');
    } catch (error) {
      console.error('Error registrando conversación:', error);
    }
  })();

  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}