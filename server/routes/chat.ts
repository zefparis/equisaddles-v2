import type { Express, Request, Response } from "express";
import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { chatStorage } from "../storage/chat";
import { sendChatNotificationToAdmin, sendChatResponseToCustomer } from "../services/brevo";
import { nanoid } from "nanoid";

interface WebSocketClient extends WebSocket {
  sessionId?: string;
  isAdmin?: boolean;
  isAlive?: boolean;
}

interface ChatClients {
  [sessionId: string]: {
    customer?: WebSocketClient;
    admin?: WebSocketClient;
  };
}

const clients: ChatClients = {};

export function setupChatWebSocket(server: Server, app: Express) {
  // Configuration WebSocket sur un chemin distinct pour éviter les conflits avec Vite HMR
  const wss = new WebSocketServer({ 
    server, 
    path: '/ws/chat'
  });

  // Ping/Pong pour maintenir la connexion active
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocketClient) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  wss.on('connection', (ws: WebSocketClient, request) => {
    console.log('New WebSocket connection');
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join_customer':
            await handleCustomerJoin(ws, message);
            break;
          case 'join_admin':
            await handleAdminJoin(ws, message);
            break;
          case 'customer_message':
            await handleCustomerMessage(ws, message);
            break;
          case 'admin_message':
            await handleAdminMessage(ws, message);
            break;
          case 'typing':
            await handleTyping(ws, message);
            break;
          case 'mark_read':
            await handleMarkRead(ws, message);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      // Nettoyer les références client
      Object.keys(clients).forEach(sessionId => {
        if (clients[sessionId].customer === ws) {
          delete clients[sessionId].customer;
        }
        if (clients[sessionId].admin === ws) {
          delete clients[sessionId].admin;
        }
        // Supprimer la session si plus de clients
        if (!clients[sessionId].customer && !clients[sessionId].admin) {
          delete clients[sessionId];
        }
      });
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Routes REST pour le chat
  app.get('/api/chat/sessions', async (req: Request, res: Response) => {
    try {
      const sessions = await chatStorage.getAllChatSessions();
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/chat/sessions/:sessionId/messages', async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const messages = await chatStorage.getChatMessages(sessionId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/chat/sessions/:sessionId/mark-read', async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { senderType } = req.body;
      await chatStorage.markMessagesAsRead(sessionId, senderType);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/chat/unread-count', async (req: Request, res: Response) => {
    try {
      const count = await chatStorage.getUnreadMessagesCount();
      res.json({ count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}

async function handleCustomerJoin(ws: WebSocketClient, message: any) {
  let sessionId = message.sessionId;
  
  if (!sessionId) {
    sessionId = nanoid();
    // Créer une nouvelle session
    await chatStorage.createChatSession({
      sessionId,
      customerName: message.customerName || 'Client anonyme',
      customerEmail: message.customerEmail || '',
      status: 'active',
    });
  }

  ws.sessionId = sessionId;
  ws.isAdmin = false;

  if (!clients[sessionId]) {
    clients[sessionId] = {};
  }
  clients[sessionId].customer = ws;

  // Envoyer l'historique des messages
  const messages = await chatStorage.getChatMessages(sessionId);
  ws.send(JSON.stringify({
    type: 'session_joined',
    sessionId,
    messages
  }));

  console.log(`Customer joined session: ${sessionId}`);
}

async function handleAdminJoin(ws: WebSocketClient, message: any) {
  const { sessionId } = message;
  ws.sessionId = sessionId;
  ws.isAdmin = true;

  if (!clients[sessionId]) {
    clients[sessionId] = {};
  }
  clients[sessionId].admin = ws;

  // Envoyer l'historique des messages
  const messages = await chatStorage.getChatMessages(sessionId);
  ws.send(JSON.stringify({
    type: 'session_joined',
    sessionId,
    messages
  }));

  console.log(`Admin joined session: ${sessionId}`);
}

async function handleCustomerMessage(ws: WebSocketClient, message: any) {
  if (!ws.sessionId) return;

  try {
    // Sauvegarder le message
    const chatMessage = await chatStorage.createChatMessage({
      sessionId: ws.sessionId,
      senderType: 'customer',
      senderName: message.senderName || 'Client',
      message: message.message,
      isRead: false,
      emailSent: false,
    });

    // Diffuser le message aux clients connectés
    const sessionClients = clients[ws.sessionId];
    if (sessionClients) {
      const messageData = JSON.stringify({
        type: 'new_message',
        message: chatMessage
      });

      if (sessionClients.customer && sessionClients.customer.readyState === WebSocket.OPEN) {
        sessionClients.customer.send(messageData);
      }
      if (sessionClients.admin && sessionClients.admin.readyState === WebSocket.OPEN) {
        sessionClients.admin.send(messageData);
      }
    }

    // Envoyer notification email à l'admin
    const session = await chatStorage.getChatSession(ws.sessionId);
    if (session) {
      const emailSent = await sendChatNotificationToAdmin(
        session.customerName || 'Client anonyme',
        session.customerEmail || '',
        message.message,
        ws.sessionId
      );
      console.log(`Email notification sent to admin: ${emailSent}`);
    }
  } catch (error) {
    console.error('Error handling customer message:', error);
  }
}

async function handleAdminMessage(ws: WebSocketClient, message: any) {
  if (!ws.sessionId) return;

  try {
    // Sauvegarder le message
    const chatMessage = await chatStorage.createChatMessage({
      sessionId: ws.sessionId,
      senderType: 'admin',
      senderName: message.senderName || 'Admin',
      message: message.message,
      isRead: false,
      emailSent: false,
    });

    // Diffuser le message aux clients connectés
    const sessionClients = clients[ws.sessionId];
    if (sessionClients) {
      const messageData = JSON.stringify({
        type: 'new_message',
        message: chatMessage
      });

      if (sessionClients.customer && sessionClients.customer.readyState === WebSocket.OPEN) {
        sessionClients.customer.send(messageData);
      }
      if (sessionClients.admin && sessionClients.admin.readyState === WebSocket.OPEN) {
        sessionClients.admin.send(messageData);
      }
    }

    // Envoyer notification email au client
    const session = await chatStorage.getChatSession(ws.sessionId);
    if (session && session.customerEmail) {
      const emailSent = await sendChatResponseToCustomer(
        session.customerEmail,
        session.customerName || 'Client',
        message.message
      );
      console.log(`Email notification sent to customer: ${emailSent}`);
    }
  } catch (error) {
    console.error('Error handling admin message:', error);
  }
}

async function handleTyping(ws: WebSocketClient, message: any) {
  if (!ws.sessionId) return;

  const sessionClients = clients[ws.sessionId];
  if (sessionClients) {
    const typingData = JSON.stringify({
      type: 'typing',
      senderType: ws.isAdmin ? 'admin' : 'customer',
      isTyping: message.isTyping
    });

    // Envoyer à l'autre participant
    if (ws.isAdmin && sessionClients.customer && sessionClients.customer.readyState === WebSocket.OPEN) {
      sessionClients.customer.send(typingData);
    } else if (!ws.isAdmin && sessionClients.admin && sessionClients.admin.readyState === WebSocket.OPEN) {
      sessionClients.admin.send(typingData);
    }
  }
}

async function handleMarkRead(ws: WebSocketClient, message: any) {
  if (!ws.sessionId) return;

  try {
    await chatStorage.markMessagesAsRead(
      ws.sessionId, 
      ws.isAdmin ? 'customer' : 'admin'
    );
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}