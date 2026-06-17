import { cn } from "@/lib/utils";
import { ChatMessage } from "@/types/chat";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import { ChatFileAttachment } from "./ChatFileAttachment";

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.sender === 'user';
  const formattedTime = format(new Date(message.timestamp), "HH:mm", { locale: ptBR });
  const hasContent = message.content && message.content.trim().length > 0;
  const hasFile = message.file && message.file.data;

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3 space-y-2 shadow-sm transition-all",
          isUser
            ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md"
            : "bg-card border border-border/50 text-foreground rounded-bl-md"
        )}
      >
        {hasContent && (
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
        )}
        
        {hasFile && message.file && (
          <ChatFileAttachment file={message.file} isUser={isUser} />
        )}
        
        <div className={cn(
          "flex items-center gap-1.5 text-[10px]",
          isUser ? "justify-end text-primary-foreground/70" : "justify-start text-muted-foreground"
        )}>
          <span>{formattedTime}</span>
          
          {isUser && (
            <>
              {message.status === 'sending' && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              {message.status === 'sent' && (
                <Check className="h-3 w-3" />
              )}
              {message.status === 'error' && (
                <AlertCircle className="h-3 w-3 text-destructive" />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
