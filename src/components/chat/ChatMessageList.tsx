import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/types/chat";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { Bot, MessageSquare, Loader2 } from "lucide-react";

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  isLoadingHistory?: boolean;
  isAutomation?: boolean;
}

export function ChatMessageList({ messages, isLoading, isLoadingHistory, isAutomation }: ChatMessageListProps) {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or loading state changes
  useEffect(() => {
    // Small timeout to ensure DOM has rendered
    const timeoutId = setTimeout(() => {
      endOfMessagesRef.current?.scrollIntoView({ behavior: "instant" });
    }, 50);
    return () => clearTimeout(timeoutId);
  }, [messages, isLoading]);

  if (isLoadingHistory) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin" />
          <p className="text-sm">Carregando mensagens...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          {isAutomation ? (
            <>
              <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Chat com Cúmulo</p>
              <p className="text-sm">Envie uma mensagem para iniciar a conversa</p>
            </>
          ) : (
            <>
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Nenhuma mensagem</p>
              <p className="text-sm">Envie uma mensagem para iniciar a conversa</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="p-4 space-y-3">
        {messages.map(message => (
          <ChatMessageBubble key={message.id} message={message} />
        ))}
        
        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl px-4 py-3 rounded-bl-sm">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        {/* Invisible element to scroll to */}
        <div ref={endOfMessagesRef} />
      </div>
    </ScrollArea>
  );
}
