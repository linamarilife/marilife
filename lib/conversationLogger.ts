/**
 * Conversation Logger - Registra conversaciones de Lina para mejorar fluidez
 * 
 * Guarda cada interacción en:
 * - /home/lina/Escritorio/conversaciones/transcripts/YYYY-MM-DD/
 * - Archivo JSON con timestamp, CallSid, speech, response, análisis
 */

import fs from 'fs/promises';
import path from 'path';

export interface ConversationEntry {
  timestamp: string;
  callSid: string;
  phone: string;
  speech: string;
  linaResponse: {
    text: string;
    intent: string;
    needsHuman: boolean;
    appointmentPrompt: boolean;
  };
  sessionData?: {
    name?: string;
    email?: string;
    captured: boolean;
  };
  analysis?: {
    durationMs?: number;
    speechConfidence?: number;
    issuesDetected?: string[];
    suggestions?: string[];
  };
}

export class ConversationLogger {
  private baseDir: string;
  
  constructor() {
    this.baseDir = '/home/lina/Escritorio/conversaciones';
  }
  
  /**
   * Guarda una entrada de conversación
   */
  async logConversation(entry: ConversationEntry): Promise<string> {
    try {
      // Crear estructura de directorios
      const date = new Date();
      const yearMonthDay = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const hour = date.getHours().toString().padStart(2, '0');
      
      const dateDir = path.join(this.baseDir, 'transcripts', yearMonthDay);
      const hourDir = path.join(dateDir, hour);
      
      await fs.mkdir(hourDir, { recursive: true });
      
      // Nombre de archivo único
      const filename = `call_${entry.callSid}_${Date.now()}.json`;
      const filepath = path.join(hourDir, filename);
      
      // Analizar conversación para detectar problemas
      const analyzedEntry = this.analyzeConversation(entry);
      
      // Guardar archivo JSON
      await fs.writeFile(
        filepath,
        JSON.stringify(analyzedEntry, null, 2),
        'utf-8'
      );
      
      // También agregar a archivo diario consolidado
      await this.appendToDailyLog(yearMonthDay, analyzedEntry);
      
      console.log(`Conversación guardada: ${filepath}`);
      return filepath;
      
    } catch (error) {
      console.error('Error guardando conversación:', error);
      // Fallback: guardar en carpeta de logs
      try {
        const fallbackPath = path.join(this.baseDir, 'logs', `fallback_${Date.now()}.json`);
        await fs.mkdir(path.dirname(fallbackPath), { recursive: true });
        await fs.writeFile(fallbackPath, JSON.stringify(entry, null, 2), 'utf-8');
        return fallbackPath;
      } catch (e) {
        console.error('Error en fallback también:', e);
        return '';
      }
    }
  }
  
  /**
   * Analiza conversación para detectar problemas y sugerir mejoras
   */
  private analyzeConversation(entry: ConversationEntry): ConversationEntry {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // 1. Detectar speech muy corto o vacío
    if (!entry.speech || entry.speech.trim().length < 3) {
      issues.push('speech_corto');
      suggestions.push('Considerar aumentar speechTimeout o añadir prompts de clarificación');
    }
    
    // 2. Detectar si Lina no entendió (respuesta por defecto)
    if (entry.linaResponse.intent === 'unknown') {
      issues.push('no_entendio');
      suggestions.push(`Añadir reconocimiento para: "${entry.speech.substring(0, 50)}..."`);
    }
    
    // 3. Detectar si usuario pidió algo específico que Lina no cubrió
    const specificTopics = ['ssn', 'papeles', 'residencia', 'inversión', 'abogado', 'multa'];
    const speechLower = entry.speech.toLowerCase();
    specificTopics.forEach(topic => {
      if (speechLower.includes(topic) && entry.linaResponse.intent !== 'unknown') {
        issues.push(`topic_no_cubierto_${topic}`);
        suggestions.push(`Considerar añadir respuesta para preguntas sobre ${topic}`);
      }
    });
    
    // 4. Detectar si debería haber capturado lead pero no lo hizo
    if (entry.linaResponse.appointmentPrompt && !entry.sessionData?.captured) {
      issues.push('lead_no_capturado');
      suggestions.push('Revisar flujo de captura de leads cuando appointmentPrompt=true');
    }
    
    // 5. Detectar patrones de conversación circular
    if (entry.speech.includes('información') && entry.linaResponse.text.includes('información')) {
      // Si ambos hablan de "información", podría ser redundante
      issues.push('posible_redundancia');
      suggestions.push('Variar respuestas para consultas de información');
    }
    
    return {
      ...entry,
      analysis: {
        issuesDetected: issues.length > 0 ? issues : undefined,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      }
    };
  }
  
  /**
   * Agrega entrada a archivo diario consolidado
   */
  private async appendToDailyLog(date: string, entry: ConversationEntry): Promise<void> {
    try {
      const logFile = path.join(this.baseDir, 'transcripts', date, 'daily.jsonl');
      
      // Crear línea JSONL
      const logLine = JSON.stringify({
        timestamp: entry.timestamp,
        callSid: entry.callSid,
        phone: entry.phone?.replace(/\d{4}$/, '****'), // Enmascarar últimos 4 dígitos
        speechPreview: entry.speech.substring(0, 100),
        intent: entry.linaResponse.intent,
        issues: entry.analysis?.issuesDetected?.length || 0,
      });
      
      await fs.appendFile(logFile, logLine + '\n', 'utf-8');
    } catch (error) {
      // Silencioso, no es crítico
      console.warn('No se pudo agregar a daily log:', error);
    }
  }
  
  /**
   * Obtiene conversaciones recientes para análisis
   */
  async getRecentConversations(days: number = 7): Promise<ConversationEntry[]> {
    try {
      const conversations: ConversationEntry[] = [];
      const transcriptsDir = path.join(this.baseDir, 'transcripts');
      
      // Leer directorios de los últimos N días
      const dirs = await fs.readdir(transcriptsDir);
      const recentDirs = dirs
        .filter(dir => /^\d{4}-\d{2}-\d{2}$/.test(dir))
        .sort()
        .reverse()
        .slice(0, days);
      
      for (const dateDir of recentDirs) {
        const datePath = path.join(transcriptsDir, dateDir);
        const hourDirs = await fs.readdir(datePath);
        
        for (const hourDir of hourDirs) {
          const hourPath = path.join(datePath, hourDir);
          const files = (await fs.readdir(hourPath)).filter(f => f.endsWith('.json'));
          
          for (const file of files) {
            try {
              const content = await fs.readFile(path.join(hourPath, file), 'utf-8');
              const entry = JSON.parse(content) as ConversationEntry;
              conversations.push(entry);
            } catch (e) {
              console.warn(`Error leyendo ${file}:`, e);
            }
          }
        }
      }
      
      return conversations.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
    } catch (error) {
      console.error('Error obteniendo conversaciones recientes:', error);
      return [];
    }
  }
  
  /**
   * Genera reporte de análisis para heartbeat
   */
  async generateHeartbeatReport(): Promise<string> {
    const conversations = await this.getRecentConversations(3); // Últimos 3 días
    
    if (conversations.length === 0) {
      return '📊 **REPORTE CONVERSACIONES**: No hay conversaciones registradas en los últimos 3 días.\n\n*Sugerencia: Probar llamada al +15614139370 para generar datos iniciales.*';
    }
    
    const totalCalls = conversations.length;
    const unknownIntents = conversations.filter(c => c.linaResponse.intent === 'unknown').length;
    const capturedLeads = conversations.filter(c => c.sessionData?.captured).length;
    const issuesCount = conversations.filter(c => c.analysis?.issuesDetected?.length).length;
    
    // Temas más frecuentes
    const speechSamples = conversations.map(c => c.speech.toLowerCase());
    const commonTopics = [
      { topic: 'obamacare', count: speechSamples.filter(s => s.includes('obamacare')).length },
      { topic: 'medicare', count: speechSamples.filter(s => s.includes('medicare')).length },
      { topic: 'precio', count: speechSamples.filter(s => s.includes('precio') || s.includes('cuánto')).length },
      { topic: 'cita', count: speechSamples.filter(s => s.includes('cita') || s.includes('agendar')).length },
      { topic: 'taxes', count: speechSamples.filter(s => s.includes('impuesto') || s.includes('tax')).length },
    ].filter(t => t.count > 0).sort((a, b) => b.count - a.count);
    
    // Issues más comunes
    const allIssues = conversations.flatMap(c => c.analysis?.issuesDetected || []);
    const issueCounts: Record<string, number> = {};
    allIssues.forEach(issue => {
      issueCounts[issue] = (issueCounts[issue] || 0) + 1;
    });
    
    const commonIssues = Object.entries(issueCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    // Construir reporte
    let report = `📊 **REPORTE CONVERSACIONES** (últimos 3 días)\n`;
    report += `• **Llamadas totales:** ${totalCalls}\n`;
    report += `• **No entendidas:** ${unknownIntents} (${Math.round(unknownIntents/totalCalls*100)}%)\n`;
    report += `• **Leads capturados:** ${capturedLeads}\n`;
    report += `• **Con issues detectados:** ${issuesCount}\n\n`;
    
    if (commonTopics.length > 0) {
      report += `📈 **Temas más frecuentes:**\n`;
      commonTopics.forEach(t => {
        report += `• ${t.topic}: ${t.count} llamadas\n`;
      });
      report += '\n';
    }
    
    if (commonIssues.length > 0) {
      report += `⚠️ **Issues más comunes:**\n`;
      commonIssues.forEach(([issue, count]) => {
        const issueName = issue.replace(/_/g, ' ');
        report += `• ${issueName}: ${count} veces\n`;
      });
      report += '\n';
    }
    
    // Sugerencias basadas en datos
    report += `💡 **Sugerencias de mejora:**\n`;
    
    if (unknownIntents > totalCalls * 0.3) { // >30% no entendidas
      report += `• **ALTA PRIORIDAD:** ${unknownIntents} llamadas no fueron entendidas. Revisar transcripciones y añadir reconocimiento para esos patrones.\n`;
    }
    
    if (commonTopics.find(t => t.topic === 'precio' && t.count > 0)) {
      report += `• ${commonTopics.find(t => t.topic === 'precio')?.count || 0} personas preguntaron por precios. Considerar añadir rangos estimados o ejemplos.\n`;
    }
    
    if (capturedLeads < totalCalls * 0.5 && totalCalls > 5) {
      report += `• Solo ${capturedLeads}/${totalCalls} leads capturados. Revisar flujo de captura y proactividad de Lina.\n`;
    }
    
    // Enlaces a conversaciones recientes
    const recentDir = conversations[0]?.timestamp.split('T')[0];
    if (recentDir) {
      report += `\n📁 **Conversaciones recientes:** \`/home/lina/Escritorio/conversaciones/transcripts/${recentDir}/\``;
    }
    
    return report;
  }
}

// Exportar instancia singleton
export const conversationLogger = new ConversationLogger();