import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, X, Minimize2 } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface ChatMessage {
  id: number;
  sessionId: string;
  senderType: 'customer' | 'admin';
  senderName: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface ChatWidgetProps {
  isAdmin?: boolean;
  sessionId?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  userEmail?: string;
  showFullPage?: boolean;
}

export default function ChatWidget({ isAdmin = false, sessionId: adminSessionId, isOpen: externalIsOpen, onToggle, userEmail, showFullPage = false }: ChatWidgetProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(externalIsOpen || false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(adminSessionId || null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showContactForm, setShowContactForm] = useState(!isAdmin && !userEmail);
  
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Si on a un email utilisateur, récupérer ou créer la session
    if (userEmail && !sessionId) {
      fetchUserSession();
    } else if (isOpen && sessionId) {
      connectWebSocket();
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isOpen, sessionId, userEmail]);

  const fetchUserSession = async () => {
    try {
      const response = await fetch(`/api/chat/user-session?email=${encodeURIComponent(userEmail!)}`);
      const data = await response.json();
      
      if (data.sessionId) {
        setSessionId(data.sessionId);
        setCustomerName(data.customerName || '');
        setCustomerEmail(userEmail!);
        setShowContactForm(false);
      }
    } catch (error) {
      console.error('Error fetching user session:', error);
    }
  };

  const connectWebSocket = () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Pour Replit, utiliser l'host actuel sans port spécifique
    const host = window.location.host; // Utilise host au lieu de hostname pour inclure le port
    const wsUrl = `${protocol}//${host}/ws/chat`;
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      setIsConnected(true);
      
      if (isAdmin && sessionId) {
        wsRef.current?.send(JSON.stringify({
          type: 'join_admin',
          sessionId: sessionId
        }));
      } else if (!isAdmin) {
        wsRef.current?.send(JSON.stringify({
          type: 'join_customer',
          sessionId: sessionId,
          customerName: customerName,
          customerEmail: customerEmail
        }));
      }
    };
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'session_joined':
          setSessionId(data.sessionId);
          setMessages(data.messages || []);
          break;
        case 'new_message':
          setMessages(prev => [...prev, data.message]);
          break;
        case 'typing':
          setIsTyping(data.isTyping && data.senderType !== (isAdmin ? 'admin' : 'customer'));
          break;
        case 'error':
          toast({
            title: "Erreur",
            description: data.message,
            variant: "destructive",
          });
          break;
      }
    };
    
    wsRef.current.onclose = () => {
      setIsConnected(false);
    };
    
    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter au chat",
        variant: "destructive",
      });
    };
  };

  const handleStartChat = () => {
    if (!customerName.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez entrer votre nom",
        variant: "destructive",
      });
      return;
    }
    
    setShowContactForm(false);
    connectWebSocket();
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !wsRef.current || !isConnected) return;
    
    const messageData = {
      type: isAdmin ? 'admin_message' : 'customer_message',
      message: newMessage,
      senderName: isAdmin ? 'Admin' : customerName,
    };
    
    wsRef.current.send(JSON.stringify(messageData));
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    if (wsRef.current && isConnected) {
      // Envoyer signal de frappe
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        isTyping: value.length > 0
      }));
      
      // Arrêter le signal après 1 seconde d'inactivité
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        if (wsRef.current && isConnected) {
          wsRef.current.send(JSON.stringify({
            type: 'typing',
            isTyping: false
          }));
        }
      }, 1000);
    }
  };

  // Synchroniser l'état externe
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setIsOpen(externalIsOpen);
    }
  }, [externalIsOpen]);
  
  if (!isAdmin && !isOpen) {
    return null;
  }

  if (!isOpen && isAdmin) {
    return null;
  }

  const getCardClasses = () => {
    if (showFullPage) return 'w-full h-full border-0 shadow-none bg-transparent';
    if (isAdmin) return 'w-full h-full';
    return `fixed bottom-4 right-4 w-80 z-50 ${isMinimized ? 'h-auto' : 'h-96'}`;
  };

  return (
    <Card className={getCardClasses()}>
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          {isAdmin ? `Chat - Session ${sessionId}` : "Support Chat"}
        </CardTitle>
        <div className="flex gap-1">
          {!isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          )}
          {!isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                onToggle && onToggle();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className="p-4 pt-0">
          {showContactForm ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="customerName">Votre nom *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Entrez votre nom"
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Email (optionnel)</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="votre@email.com"
                />
              </div>
              <Button onClick={handleStartChat} className="w-full">
                Commencer le chat
              </Button>
            </div>
          ) : (
            <>
              <div className={`${isAdmin ? 'h-64' : 'h-48'} overflow-y-auto border rounded p-2 mb-4 space-y-2`}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderType === (isAdmin ? 'admin' : 'customer') ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-2 rounded-lg text-sm ${
                        message.senderType === (isAdmin ? 'admin' : 'customer')
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="font-medium text-xs opacity-70 mb-1">
                        {message.senderName}
                      </div>
                      <div>{message.message}</div>
                      <div className="text-xs opacity-50 mt-1">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted p-2 rounded-lg text-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isConnected ? "Tapez votre message..." : "Connexion..."}
                  disabled={!isConnected}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || !isConnected}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground text-center">
                {isConnected ? (
                  "Connecté"
                ) : (
                  "Connexion..."
                )}
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}