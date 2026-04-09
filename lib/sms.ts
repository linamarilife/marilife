/**
 * SMS service for sending follow-ups via Twilio
 */

interface SMSOptions {
  to: string;
  body: string;
}

/**
 * Send SMS using Twilio
 */
export async function sendSMS(options: SMSOptions): Promise<boolean> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;
  
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.log('Twilio not configured, skipping SMS');
    return false;
  }
  
  try {
    const twilio = await import('twilio');
    const client = twilio.default(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    
    const result = await client.messages.create({
      body: options.body,
      from: TWILIO_PHONE_NUMBER,
      to: options.to,
    });
    
    console.log('Twilio SMS sent:', result.sid);
    return true;
  } catch (error) {
    console.error('Failed to send Twilio SMS:', error);
    return false;
  }
}

/**
 * Send follow-up SMS to a lead
 */
export async function sendFollowUpSMS(lead: any): Promise<boolean> {
  const message = `Hola ${lead.name}, somos Marilife. ¡Gracias por revisar su subsidio ACA! ` +
    `Calificó para $${lead.estimatedSubsidy || 0}/mes en ahorros. ` +
    `Un agente licenciado le llamará pronto al ${lead.phone} para discutir sus opciones de $${lead.estimatedPremium || 0}/mes. ` +
    `Responda STOP para cancelar.`;
  
  return await sendSMS({
    to: `+1${lead.phone.replace(/\\D/g, '')}`,
    body: message,
  });
}

/**
 * Send appointment reminder SMS
 */
export async function sendAppointmentReminder(lead: any, appointmentTime: string): Promise<boolean> {
  const message = `Hola ${lead.name}, le recordamos su cita con Marilife hoy a las ${appointmentTime}. ` +
    `Si necesita reprogramar, responda a este mensaje. ¡Gracias!`;
  
  return await sendSMS({
    to: `+1${lead.phone.replace(/\\D/g, '')}`,
    body: message,
  });
}