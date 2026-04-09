/**
 * Call Session Manager - Almacena datos temporales de leads durante llamadas
 * 
 * Usa CallSid de Twilio como identificador único.
 * Los datos se guardan en memoria (volátil) - en producción usar Redis o DB.
 */

export interface CallSessionData {
  callSid: string;
  phone: string;
  name?: string;
  email?: string;
  intent?: 'insurance' | 'taxes' | 'both';
  collectedAt: number;
  lastUpdated: number;
}

class CallSessionManager {
  private sessions: Map<string, CallSessionData> = new Map();
  private readonly TTL_MS = 30 * 60 * 1000; // 30 minutos

  createSession(callSid: string, phone: string): void {
    const now = Date.now();
    this.sessions.set(callSid, {
      callSid,
      phone,
      collectedAt: now,
      lastUpdated: now,
    });
    this.cleanup();
  }

  getSession(callSid: string): CallSessionData | undefined {
    const session = this.sessions.get(callSid);
    if (session && Date.now() - session.lastUpdated > this.TTL_MS) {
      this.sessions.delete(callSid);
      return undefined;
    }
    return session;
  }

  updateSession(callSid: string, updates: Partial<CallSessionData>): boolean {
    const session = this.getSession(callSid);
    if (!session) return false;
    
    Object.assign(session, updates, { lastUpdated: Date.now() });
    this.sessions.set(callSid, session);
    return true;
  }

  deleteSession(callSid: string): boolean {
    return this.sessions.delete(callSid);
  }

  completeSession(callSid: string): CallSessionData | null {
    const session = this.getSession(callSid);
    if (!session) return null;
    
    // Verificar que tenga datos mínimos
    if (!session.phone) return null;
    
    const completed = { ...session };
    this.deleteSession(callSid);
    return completed;
  }

  private cleanup(): void {
    const now = Date.now();
    // Convert to array to avoid downlevel iteration issues
    const entries = Array.from(this.sessions.entries());
    for (const [callSid, session] of entries) {
      if (now - session.lastUpdated > this.TTL_MS) {
        this.sessions.delete(callSid);
      }
    }
  }
}

export const callSessionManager = new CallSessionManager();