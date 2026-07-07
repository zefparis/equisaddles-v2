import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, ArrowLeft } from "lucide-react";

export default function SimpleChatPage() {
  const [email, setEmail] = useState<string>("");
  const [messages, setMessages] = useState<Array<{id: number, sender: string, text: string, time: string}>>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Extraire l'email de l'URL avec délai pour s'assurer du chargement complet
    const timer = setTimeout(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const emailParam = urlParams.get('email');
      
      console.log('Production URL:', window.location.href);
      console.log('Search params:', window.location.search);
      console.log('Email param:', emailParam);
      
      if (emailParam) {
        setEmail(emailParam);
      }
      setIsLoaded(true);
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        sender: email || "Client",
        text: newMessage,
        time: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, message]);
      setNewMessage("");
      
      // Réponse automatique
      setTimeout(() => {
        const autoReply = {
          id: Date.now() + 1,
          sender: "Equi Saddles Support",
          text: "Merci pour votre message ! Nous vous répondrons rapidement.",
          time: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, autoReply]);
      }, 1500);
    }
  };

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.location.href = '/'}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <MessageCircle className="h-6 w-6" />
          <h1 className="text-xl font-semibold">Support Chat</h1>
          {email && <span className="ml-auto text-sm opacity-80">{email}</span>}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Info Debug - Plus détaillé pour production */}
        <div className="mb-4 p-3 bg-muted/50 rounded-lg text-sm space-y-1">
          <div><strong>Debug Production:</strong></div>
          <div>URL complète: {window.location.href}</div>
          <div>Search: {window.location.search}</div>
          <div>Email trouvé: {email || "❌ Non trouvé"}</div>
          <div>Host: {window.location.host}</div>
          <div>Pathname: {window.location.pathname}</div>
        </div>

        {/* Chat Container */}
        <div className="bg-card rounded-lg shadow-lg overflow-hidden">
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">
                  {email ? `Bienvenue ${email}` : "Support Chat Equi Saddles"}
                </p>
                <p>
                  {email 
                    ? "Commencez la conversation en tapant votre message ci-dessous" 
                    : "Email requis pour démarrer le chat"}
                </p>
                {!email && (
                  <div className="mt-3 text-sm text-amber-600 dark:text-amber-400">
                    URL correcte: /simple-chat?email=votre@email.com
                  </div>
                )}
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === email || message.sender === "Client" ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender === email || message.sender === "Client"
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-xs opacity-70 mb-1">{message.sender}</div>
                    <p>{message.text}</p>
                    <div className="text-xs opacity-70 mt-1">{message.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Input */}
          <div className="border-t p-4 bg-background">
            <div className="flex gap-2">
              <Input
                placeholder={email ? "Tapez votre message..." : "Email requis pour envoyer un message"}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && email && handleSendMessage()}
                className="flex-1"
                disabled={!email}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !email}
                size="icon"
                title={!email ? "Email requis" : "Envoyer le message"}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Instructions Production */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center text-sm">
          <div className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            🌐 Interface Chat Production
          </div>
          <div className="text-blue-700 dark:text-blue-300 space-y-1">
            <div>Cette page fonctionne sur {window.location.host}</div>
            <div>Email détecté: {email ? `✅ ${email}` : "❌ Aucun email dans l'URL"}</div>
            <div className="text-xs">Format attendu: ?email=votre@email.com</div>
          </div>
        </div>
      </div>
    </div>
  );
}