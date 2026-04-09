/**
 * Lina - Asistente virtual de seguros médicos y taxes
 * 
 * Esta función genera respuestas basadas en el conocimiento de Lina (SOUL.md)
 * para preguntas sobre seguros médicos en Florida y preparación de impuestos.
 */

export interface LinaResponse {
  text: string;          // Respuesta en texto (para TTS)
  intent: 'insurance' | 'taxes' | 'greeting' | 'appointment' | 'unknown';
  needsHuman: boolean;   // Si debe escalar a especialista humano
  appointmentPrompt?: boolean; // Si debe sugerir agendar cita
}

/**
 * Analiza el texto del usuario y genera una respuesta apropiada.
 */
export function generateLinaResponse(userText: string): LinaResponse {
  const text = userText.toLowerCase().trim();
  
  // Saludos y contacto inicial
  if (
    text.includes('hola') ||
    text.includes('buenos') ||
    text.includes('buenas') ||
    text.includes('quien eres') ||
    text.includes('qué eres')
  ) {
    return {
      text: '¡Hola! Soy Lina, tu asistente de seguros médicos y taxes en la Florida. ¿En qué te puedo ayudar hoy?',
      intent: 'greeting',
      needsHuman: false,
    };
  }
  
  // Seguros médicos - ACA / Obamacare
  if (
    text.includes('seguro') ||
    text.includes('obamacare') ||
    text.includes('aca') ||
    text.includes('subsidio') ||
    text.includes('open enrollment') ||
    text.includes('inscripción') ||
    text.includes('prima') ||
    text.includes('cobertura') ||
    text.includes('medicaid') ||
    text.includes('medicare')
  ) {
    // Detectar preguntas específicas de precios
    if (
      text.includes('cuánto') ||
      text.includes('cuanto') ||
      text.includes('precio') ||
      text.includes('cuesta') ||
      text.includes('valor') ||
      text.includes('tarifa')
    ) {
      return {
        text: 'Para darte el precio exacto de un plan necesito hacerte unas preguntas rápidas sobre tu hogar e ingresos. ¿Me das un momento? Te recomiendo agendar una cita con nuestro especialista para una cotización personalizada.',
        intent: 'insurance',
        needsHuman: true,
        appointmentPrompt: true,
      };
    }
    
    // Preguntas generales sobre elegibilidad
    if (
      text.includes('califico') ||
      text.includes('elegibilidad') ||
      text.includes('puedo') ||
      text.includes('requisitos')
    ) {
      return {
        text: 'La elegibilidad para subsidios ACA depende de tu ingreso y tamaño del hogar. Para el 2026, los subsidios están disponibles para hogares con ingresos entre el 100% y 400% del nivel federal de pobreza. ¿Te gustaría que te conecte con nuestro especialista para revisar tu caso específico?',
        intent: 'insurance',
        needsHuman: true,
        appointmentPrompt: true,
      };
    }
    
    // Respuesta general sobre seguros
    return {
      text: 'Te ayudo con seguros médicos en la Florida: planes ACA (Obamacare), Medicare, Medicaid, y seguros privados. El Open Enrollment para 2026 es del 1 de noviembre 2026 al 15 de enero 2027. ¿Quieres información sobre algún tipo específico de seguro o prefieres agendar una cita para una cotización personalizada?',
      intent: 'insurance',
      needsHuman: false,
      appointmentPrompt: true,
    };
  }
  
  // Taxes / Impuestos
  if (
    text.includes('impuesto') ||
    text.includes('tax') ||
    text.includes('irs') ||
    text.includes('declaración') ||
    text.includes('itin') ||
    text.includes('crédito') ||
    text.includes('reembolso') ||
    text.includes('w-2') ||
    text.includes('1099')
  ) {
    // Preguntas específicas sobre montos o asesoría detallada
    if (
      text.includes('cuánto') ||
      text.includes('cuanto') ||
      text.includes('monto') ||
      text.includes('debo') ||
      text.includes('reembolso') ||
      text.includes('cuánto me toca')
    ) {
      return {
        text: 'Para darte números exactos sobre tu declaración de impuestos necesito que hables directamente con nuestra preparadora de impuestos. Ella puede revisar tu situación completa y calcular créditos como el EITC o Child Tax Credit. ¿Te agendo una cita?',
        intent: 'taxes',
        needsHuman: true,
        appointmentPrompt: true,
      };
    }
    
    // Plazos y fechas
    if (
      text.includes('fecha') ||
      text.includes('plazo') ||
      text.includes('cuándo') ||
      text.includes('cuando') ||
      text.includes('último día')
    ) {
      return {
        text: 'El plazo para presentar la declaración de impuestos del año fiscal 2025 es el 15 de abril de 2026. Puedes solicitar una extensión hasta el 15 de octubre de 2026. ¿Necesitas ayuda con tu declaración de este año?',
        intent: 'taxes',
        needsHuman: false,
        appointmentPrompt: true,
      };
    }
    
    // Respuesta general sobre taxes
    return {
      text: 'Te ayudo con preparación de impuestos en EE.UU.: declaraciones individuales o conjuntas, ITIN, créditos como EITC y Child Tax Credit. Para tu caso específico, es mejor que hables con nuestra preparadora de impuestos. ¿Te agendo una cita?',
      intent: 'taxes',
      needsHuman: true,
      appointmentPrompt: true,
    };
  }
  
  // Agendar cita
  if (
    text.includes('cita') ||
    text.includes('agendar') ||
    text.includes('llamada') ||
    text.includes('contacto') ||
    text.includes('especialista') ||
    text.includes('hablar con alguien')
  ) {
    return {
      text: '¡Claro! Para agendar una cita necesito tu nombre y número de teléfono. Uno de nuestros especialistas te llamará en el horario que prefieras. ¿Me puedes decir tu nombre completo?',
      intent: 'appointment',
      needsHuman: true,
      appointmentPrompt: false, // Ya estamos en proceso de agendar
    };
  }
  
  // Despedida
  if (
    text.includes('gracias') ||
    text.includes('adiós') ||
    text.includes('chao') ||
    text.includes('hasta luego')
  ) {
    return {
      text: '¡Gracias a ti! Recuerda que estoy aquí para ayudarte con seguros médicos e impuestos. Que tengas un excelente día.',
      intent: 'unknown',
      needsHuman: false,
    };
  }
  
  // Respuesta por defecto (no entendí)
  return {
    text: 'Perdona, no entendí completamente. Soy Lina, especialista en seguros médicos y preparación de impuestos en la Florida. ¿Puedes decirlo de otra forma o prefieres agendar una cita con nuestro especialista humano?',
    intent: 'unknown',
    needsHuman: true,
    appointmentPrompt: true,
  };
}

/**
 * Extrae posibles datos de lead del texto (nombre, teléfono, email).
 */
export function extractLeadInfo(text: string): { name?: string; phone?: string; email?: string } {
  // Buscar teléfono
  const phoneMatch = text.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/);
  const phone = phoneMatch ? phoneMatch[1].replace(/\D/g, '') : undefined;
  
  // Buscar email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0].toLowerCase() : undefined;
  
  // Buscar nombres comunes (lista básica)
  const commonNames = [
    'maria', 'jose', 'juan', 'ana', 'luis', 'carlos', 'marta', 'pedro', 'lucia',
    'miguel', 'elena', 'david', 'patricia', 'francisco', 'isabel', 'antonio',
    'rosa', 'jorge', 'gloria', 'ricardo', 'fernando', 'andres', 'claudia', 'sandra'
  ];
  
  // También buscar patrones como "me llamo X" o "soy X"
  let name: string | undefined;
  const namePatterns = [
    /me llamo\s+([a-zA-ZÀ-ÿ]+)/i,
    /soy\s+([a-zA-ZÀ-ÿ]+)/i,
    /mi nombre es\s+([a-zA-ZÀ-ÿ]+)/i,
    /nombre:\s*([a-zA-ZÀ-ÿ]+)/i
  ];
  
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (candidate.length > 1) {
        name = candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase();
        break;
      }
    }
  }
  
  // Si no se encontró por patrones, buscar palabras que coincidan con nombres comunes
  if (!name) {
    const words = text.split(/\s+/);
    for (const word of words) {
      const cleanWord = word.replace(/[^a-zA-ZÀ-ÿ]/g, '');
      if (cleanWord.length > 2 && commonNames.includes(cleanWord.toLowerCase())) {
        name = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();
        break;
      }
    }
  }
  
  return { name, phone, email };
}