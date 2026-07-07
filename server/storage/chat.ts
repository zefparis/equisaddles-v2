import { ChatSession, ChatMessage, InsertChatSession, InsertChatMessage } from "../../shared/schema";

// Interface pour la gestion du chat en mémoire
export interface IChatStorage {
  // Sessions
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSession(sessionId: string): Promise<ChatSession | null>;
  getAllChatSessions(): Promise<ChatSession[]>;
  updateChatSessionActivity(sessionId: string): Promise<void>;
  updateChatSessionStatus(sessionId: string, status: string): Promise<void>;
  getChatSessionByEmail(email: string): Promise<ChatSession | null>;
  
  // Messages
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  markMessagesAsRead(sessionId: string, senderType?: string): Promise<void>;
  getUnreadMessagesCount(sessionId?: string): Promise<number>;
}

// Implémentation en mémoire pour le développement
export class ChatMemStorage implements IChatStorage {
  private sessions: ChatSession[] = [];
  private messages: ChatMessage[] = [];
  private nextSessionId = 1;
  private nextMessageId = 1;

  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const newSession: ChatSession = {
      id: this.nextSessionId++,
      sessionId: session.sessionId,
      customerName: session.customerName || null,
      customerEmail: session.customerEmail || null,
      status: session.status || 'active',
      lastActivity: new Date(),
      createdAt: new Date(),
    };
    this.sessions.push(newSession);
    return newSession;
  }

  async getChatSession(sessionId: string): Promise<ChatSession | null> {
    return this.sessions.find(s => s.sessionId === sessionId) || null;
  }

  async getAllChatSessions(): Promise<ChatSession[]> {
    return [...this.sessions].sort((a, b) => 
      new Date(b.lastActivity || b.createdAt!).getTime() - new Date(a.lastActivity || a.createdAt!).getTime()
    );
  }

  async updateChatSessionActivity(sessionId: string): Promise<void> {
    const session = this.sessions.find(s => s.sessionId === sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  async updateChatSessionStatus(sessionId: string, status: string): Promise<void> {
    const session = this.sessions.find(s => s.sessionId === sessionId);
    if (session) {
      session.status = status;
    }
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const newMessage: ChatMessage = {
      id: this.nextMessageId++,
      sessionId: message.sessionId,
      senderType: message.senderType,
      senderName: message.senderName,
      message: message.message,
      isRead: message.isRead || false,
      emailSent: message.emailSent || false,
      createdAt: new Date(),
    };
    this.messages.push(newMessage);
    
    // Mettre à jour l'activité de la session
    await this.updateChatSessionActivity(message.sessionId);
    
    return newMessage;
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return this.messages
      .filter(m => m.sessionId === sessionId)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
  }

  async markMessagesAsRead(sessionId: string, senderType?: string): Promise<void> {
    this.messages
      .filter(m => m.sessionId === sessionId && (!senderType || m.senderType !== senderType))
      .forEach(m => {
        m.isRead = true;
      });
  }

  async getUnreadMessagesCount(sessionId?: string): Promise<number> {
    let messages = this.messages.filter(m => !m.isRead);
    if (sessionId) {
      messages = messages.filter(m => m.sessionId === sessionId);
    }
    return messages.length;
  }

  // Récupérer une session par email client
  async getChatSessionByEmail(email: string): Promise<ChatSession | null> {
    const session = this.sessions.find(s => s.customerEmail === email);
    return session || null;
  }
}

// Instance globale pour le stockage en mémoire
export const chatStorage = new ChatMemStorage();