/**
 * Email service for sending notifications to Mariela
 * Uses Gmail SMTP with app password
 */

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const EMAIL_CONFIG = {
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: 'linamarilife@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD || 'uedvzrhkqbxbbymq', // App password from env
  },
};

/**
 * Send email using SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Dynamic import of nodemailer to avoid bundle issues
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.host,
      port: EMAIL_CONFIG.port,
      secure: EMAIL_CONFIG.secure,
      auth: EMAIL_CONFIG.auth,
    });
    
    const mailOptions = {
      from: `"Lina - Marilife" <${EMAIL_CONFIG.auth.user}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text.replace(/\n/g, '<br>'),
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
    
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Fallback to direct SMTP without nodemailer
    return await sendEmailDirectSMTP(options);
  }
}

/**
 * Direct SMTP implementation as fallback
 */
async function sendEmailDirectSMTP(options: EmailOptions): Promise<boolean> {
  // This is a simplified implementation
  // In production, use a proper email service
  console.log('Attempting direct SMTP fallback for email');
  
  // For now, just log the email that would be sent
  console.log('Email would be sent:', {
    to: options.to,
    subject: options.subject,
    text: options.text.substring(0, 200) + '...',
  });
  
  return false; // Return false to indicate fallback didn't work
}

/**
 * Send lead notification email to Mariela
 */
export async function sendLeadNotificationEmail(lead: any): Promise<boolean> {
  const subject = `📞 NUEVO LEAD DESDE LLAMADA: ${lead.name} - ${lead.phone}`;
  
  const text = `
NUEVO LEAD CAPTURADO DESDE LLAMADA DE VOZ
==========================================

📋 INFORMACIÓN DEL CLIENTE:
• Nombre: ${lead.name}
• Email: ${lead.email || 'No proporcionado'}
• Teléfono: ${lead.phone}
• Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'America/New_York' })}
• Lead ID: ${lead.id}

📞 ACCIÓN REQUERIDA:
1. Llamar al cliente en 24 horas
2. Preguntar si necesita seguros médicos, taxes, o ambos
3. Seguir protocolo de venta correspondiente

💡 NOTAS:
- Este lead viene del sistema de voz de Lina (${lead.phone ? 'teléfono capturado automáticamente' : 'teléfono no disponible'})
- Cliente llamó al +15614139370
- Si el cliente necesita seguros, usar HealthSherpa para cotización
- Si necesita taxes, preparar documentación necesaria
  `.trim();
  
  return await sendEmail({
    to: 'linamarilife@gmail.com',
    subject,
    text,
  });
}

/**
 * Send ACA lead email (for web form leads)
 */
export async function sendACALeadEmail(lead: any): Promise<boolean> {
  const subject = `🎯 NUEVO LEAD ACA: ${lead.name} - $${lead.estimatedSubsidy}/mes de subsidio`;
  
  const text = `
NUEVO LEAD CAPTURADO - ACA Insurance Funnel
===========================================

📋 INFORMACIÓN DEL CLIENTE:
• Nombre: ${lead.name}
• Email: ${lead.email}
• Teléfono: ${lead.phone}
• Edad: ${lead.age}
• Ingreso anual: $${lead.income}
• Tamaño del hogar: ${lead.householdSize}
• Código postal: ${lead.zipCode}
• Fumador: ${lead.tobaccoUse ? 'Sí' : 'No'}

💰 ESTIMADO DE SUBSIDIO:
• Subsidio mensual: $${lead.estimatedSubsidy}
• Prima estimada: $${lead.estimatedPremium}
• Nivel de plan: ${lead.planTier}

⏰ FECHA: ${new Date().toLocaleString('es-ES', { timeZone: 'America/New_York' })}

📞 ACCIÓN REQUERIDA:
1. Cotizar planes reales en HealthSherpa.com
2. Llamar al cliente en 24 horas
3. Seguir protocolo de venta ACA

🔗 HEALTHSHERPA:
- Iniciar sesión: https://broker.healthsherpa.com
- Usar ZIP ${lead.zipCode}, edad ${lead.age}, ingreso $${lead.income}

💡 NOTAS:
- Este lead viene del funnel ACA automatizado
- Cliente espera llamada para cotizaciones reales
- Recordar: planes mostrados fueron ejemplos, necesita cotización real
  `.trim();
  
  return await sendEmail({
    to: 'linamarilife@gmail.com',
    subject,
    text,
  });
}