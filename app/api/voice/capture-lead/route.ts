import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { callSessionManager } from '@/lib/callSession';
import { extractLeadInfo } from '@/lib/lina';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const speechResult = formData.get('SpeechResult') as string | null;
  const callSid = formData.get('CallSid') as string | null;
  const callerNumber = formData.get('Caller') as string | null;
  const fromNumber = formData.get('From') as string | null;
  
  if (!callSid) {
    return NextResponse.json({ error: 'No CallSid provided' }, { status: 400 });
  }
  
  const phone = callerNumber || fromNumber;
  const host = request.headers.get('host') || 'pseudoprostyle-nonepisodical-zaid.ngrok-free.dev';
  const origin = `https://${host}`;
  
  const twiml = new twilio.twiml.VoiceResponse();
  
  // Obtener o crear sesión
  let session = callSessionManager.getSession(callSid);
  if (!session && phone) {
    callSessionManager.createSession(callSid, phone.replace(/\D/g, ''));
    session = callSessionManager.getSession(callSid);
  }
  
  if (!session) {
    // No hay teléfono y no hay sesión - pedir teléfono primero
    const askPhoneUrl = `${origin}/api/tts?text=${encodeURIComponent('Para ayudarte mejor, necesito tu número de teléfono. Por favor, dígalo después del tono.')}&lang=es`;
    twiml.play(askPhoneUrl);
    
    const gather = twiml.gather({
      input: ['speech'],
      language: 'es-ES',
      speechTimeout: 'auto',
      action: `${origin}/api/voice/capture-lead`,
      method: 'POST',
    });
    
    twiml.pause({ length: 10 });
    twiml.redirect(`${origin}/api/voice`);
    
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
  
  // Procesar speech si existe
  if (speechResult) {
    const extracted = extractLeadInfo(speechResult);
    
    // Actualizar sesión con datos extraídos
    const updates: any = {};
    if (extracted.name && !session.name) updates.name = extracted.name;
    if (extracted.email && !session.email) updates.email = extracted.email;
    if (extracted.phone && !session.phone) updates.phone = extracted.phone;
    
    if (Object.keys(updates).length > 0) {
      callSessionManager.updateSession(callSid, updates);
      session = callSessionManager.getSession(callSid)!;
    }
  }
  
  // Determinar qué dato falta
  let missingField: 'name' | 'email' | 'complete' = 'complete';
  if (!session.name) {
    missingField = 'name';
  } else if (!session.email) {
    missingField = 'email';
  }
  
  // Si ya tenemos todos los datos, crear lead y finalizar
  if (missingField === 'complete' && session.name && session.phone) {
    try {
      // Crear lead completo en la base de datos
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
          notes: `Lead capturado desde llamada de voz. CallSid: ${callSid}`,
        },
      });
      
      console.log('Lead completo creado desde llamada:', lead.id);
      
      // Intentar enviar email a Mariela (async)
      try {
        await sendLeadEmailToMariela(lead, origin);
      } catch (emailError) {
        console.error('Error enviando email:', emailError);
      }
      
      // Mensaje de confirmación
      const confirmUrl = `${origin}/api/tts?text=${encodeURIComponent(`Gracias ${session.name}. Hemos registrado tu información. Uno de nuestros especialistas te contactará pronto al ${session.phone}. ¿Hay algo más en lo que te pueda ayudar?`)}&lang=es`;
      twiml.play(confirmUrl);
      
      // Eliminar sesión
      callSessionManager.deleteSession(callSid);
      
      // Redirigir al proceso principal para continuar conversación
      twiml.pause({ length: 1 });
      twiml.redirect(`${origin}/api/voice/process`);
      
    } catch (error) {
      console.error('Error creando lead:', error);
      const errorUrl = `${origin}/api/tts?text=${encodeURIComponent('Lo siento, hubo un error registrando tu información. Por favor, intenta llamar nuevamente o visita nuestro sitio web.')}&lang=es`;
      twiml.play(errorUrl);
      twiml.hangup();
    }
    
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
  
  // Pedir el dato que falta
  let prompt = '';
  if (missingField === 'name') {
    prompt = session.name 
      ? `¿${session.name}, es correcto? Si no, por favor dime tu nombre completo.`
      : 'Para agendar tu cita, necesito tu nombre completo. Por favor, dime tu nombre.';
  } else if (missingField === 'email') {
    prompt = `Gracias ${session.name}. Ahora necesito tu correo electrónico para enviarte información. Por favor, dime tu email.`;
  }
  
  if (prompt) {
    const promptUrl = `${origin}/api/tts?text=${encodeURIComponent(prompt)}&lang=es`;
    twiml.play(promptUrl);
    
    const gather = twiml.gather({
      input: ['speech'],
      language: 'es-ES',
      speechTimeout: 'auto',
      action: `${origin}/api/voice/capture-lead`,
      method: 'POST',
    });
    
    // Si no hay respuesta, repetir después de 10 segundos
    twiml.pause({ length: 10 });
    twiml.redirect(`${origin}/api/voice/capture-lead`);
  } else {
    // Fallback
    twiml.redirect(`${origin}/api/voice`);
  }
  
  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}

/**
 * Envía email a Mariela con los datos del lead
 */
async function sendLeadEmailToMariela(lead: any, origin: string): Promise<boolean> {
  try {
    const emailData = {
      to: 'linamarilife@gmail.com',
      subject: `📞 NUEVO LEAD DESDE LLAMADA: ${lead.name} - ${lead.phone}`,
      text: `
NUEVO LEAD CAPTURADO DESDE LLAMADA DE VOZ
==========================================

📋 INFORMACIÓN DEL CLIENTE:
• Nombre: ${lead.name}
• Email: ${lead.email}
• Teléfono: ${lead.phone}
• Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'America/New_York' })}

📞 ACCIÓN REQUERIDA:
1. Llamar al cliente en 24 horas
2. Revisar necesidades (seguros/taxes)
3. Seguir protocolo de venta

💡 NOTAS:
- Este lead viene del sistema de voz de Lina
- Cliente llamó al +15614139370
- Lead ID: ${lead.id}
      `.trim(),
    };
    
    // Usar el endpoint /api/lead para enviar email (que ya tiene la lógica implementada)
    // Pero necesitamos una API key o método más simple
    // Por ahora, solo log
    console.log('Email para Mariela:', emailData);
    
    // En producción, implementar envío real de email
    // Por ahora usar el endpoint de email existente si está disponible
    const emailEndpoint = `${origin}/api/email`;
    const response = await fetch(emailEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData),
    }).catch(() => null);
    
    if (response && response.ok) {
      console.log('Email enviado a Mariela');
      return true;
    }
    
    // Fallback: enviar usando Gmail SMTP (implementación simple)
    return await sendEmailViaSMTP(emailData);
    
  } catch (error) {
    console.error('Error en sendLeadEmailToMariela:', error);
    return false;
  }
}

/**
 * Envía email usando Gmail SMTP (fallback)
 */
async function sendEmailViaSMTP(emailData: any): Promise<boolean> {
  // Esta función requeriría configuración de SMTP
  // Por ahora, solo log
  console.log('SMTP email no implementado completamente');
  return false;
}