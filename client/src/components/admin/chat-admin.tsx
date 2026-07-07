import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { MessageCircle, User, Mail, Clock } from "lucide-react";
import ChatWidget from "../chat/chat-widget";
import { useToast } from "@/hooks/use-toast";

interface ChatSession {
  id: number;
  sessionId: string;
  customerName: string | null;
  customerEmail: string | null;
  status: string;
  lastActivity: string;
  createdAt: string;
}

interface ChatMessage {
  id: number;
  sessionId: string;
  senderType: 'customer' | 'admin';
  senderName: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function ChatAdmin() {
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Récupérer toutes les sessions de chat
  const { data: sessions = [], refetch: refetchSessions } = useQuery<ChatSession[]>({
    queryKey: ['/api/chat/sessions'],
    refetchInterval: 5000, // Actualiser toutes les 5 secondes
  });

  // Récupérer le nombre de messages non lus
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['/api/chat/unread-count'],
    refetchInterval: 3000, // Actualiser toutes les 3 secondes
  });

  useEffect(() => {
    if (unreadData) {
      setUnreadCount(unreadData.count);
    }
  }, [unreadData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)} h`;
    return date.toLocaleDateString('fr-FR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Actif</Badge>;
      case 'closed':
        return <Badge variant="secondary">Fermé</Badge>;
      case 'archived':
        return <Badge variant="outline">Archivé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSession(sessionId);
  };

  if (selectedSession) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Chat avec le client</h3>
          <Button
            variant="outline"
            onClick={() => setSelectedSession(null)}
          >
            Retour à la liste
          </Button>
        </div>
        
        <div className="h-96 border rounded-lg">
          <ChatWidget 
            isAdmin={true} 
            sessionId={selectedSession}
            isOpen={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Gestion des Chats
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
            </Badge>
          )}
        </h3>
        <Button
          variant="outline"
          onClick={() => refetchSessions()}
          size="sm"
        >
          Actualiser
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="text-lg font-medium mb-2">Aucune conversation</h4>
            <p className="text-muted-foreground">
              Les conversations avec les clients apparaîtront ici.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card key={session.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {session.customerName || 'Client anonyme'}
                      </span>
                      {getStatusBadge(session.status)}
                    </div>
                    
                    {session.customerEmail && (
                      <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {session.customerEmail}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Dernière activité: {formatDate(session.lastActivity)}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSessionSelect(session.sessionId)}
                  >
                    Ouvrir le chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}