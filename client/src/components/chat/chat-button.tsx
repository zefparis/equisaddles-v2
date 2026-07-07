import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "../ui/button";
import ChatWidget from "./chat-widget";

export default function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Bouton flottant */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className="
              h-14 w-14 rounded-full shadow-2xl
              bg-primary hover:bg-primary/90
              border-2 border-white
              transition-all duration-300 ease-in-out
              hover:scale-110 hover:shadow-xl
            "
            size="lg"
          >
            <MessageCircle className="h-6 w-6 text-white" />
          </Button>
        </div>
      )}

      {/* Widget de chat */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="w-80 max-w-[calc(100vw-2rem)]">
            <ChatWidget 
              isOpen={isOpen} 
              onToggle={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}