import { useState, useCallback, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder = "Digite sua mensagem..." }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = useCallback(() => {
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage("");
    }
  }, [message, disabled, onSend]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className="p-4 border-t bg-gradient-to-t from-muted/30 to-background">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "pr-4 py-5 rounded-xl border-border/50 bg-background shadow-sm transition-all",
              "focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/50",
              disabled && "opacity-60"
            )}
          />
        </div>
        <Button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          size="icon"
          className={cn(
            "h-11 w-11 rounded-xl shadow-sm transition-all",
            "bg-gradient-to-br from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
            disabled && "opacity-60"
          )}
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      {disabled && (
        <p className="text-xs text-muted-foreground mt-2 text-center animate-pulse">
          ✨ Processando resposta...
        </p>
      )}
    </div>
  );
}
