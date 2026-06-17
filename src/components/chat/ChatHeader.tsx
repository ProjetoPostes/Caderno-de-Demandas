import { ChatContact } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Sparkles } from "lucide-react";

interface ChatHeaderProps {
  contact: ChatContact | null;
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  operador_chefe: "Operador Chefe",
  operador: "Operador",
  consultor: "Consultor",
};

export function ChatHeader({ contact }: ChatHeaderProps) {
  if (!contact) {
    return (
      <div className="h-16 border-b flex items-center px-4 bg-muted/30">
        <span className="text-muted-foreground">Selecione uma conversa</span>
      </div>
    );
  }

  const isAutomation = contact.type === 'automation';
  const initials = contact.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="h-16 border-b flex items-center gap-3 px-4 bg-gradient-to-r from-background to-muted/30">
      <div className="relative">
        <Avatar className="h-11 w-11 ring-2 ring-border/50 shadow-sm">
          {contact.avatar_url ? (
            <AvatarImage src={contact.avatar_url} alt={contact.name} />
          ) : null}
          <AvatarFallback className={isAutomation 
            ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground" 
            : "bg-muted"
          }>
            {isAutomation ? <Bot className="h-5 w-5" /> : initials || <User className="h-5 w-5" />}
          </AvatarFallback>
        </Avatar>
        {isAutomation && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-accent rounded-full p-0.5">
            <Sparkles className="h-3 w-3 text-accent-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1">
        <div className="font-semibold text-foreground">{contact.name}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge 
            variant={isAutomation ? "default" : "outline"} 
            className="text-[10px] px-2 py-0 font-medium"
          >
            {isAutomation ? "✨ Automação" : roleLabels[contact.role || ''] || "Usuário"}
          </Badge>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Online
          </span>
        </div>
      </div>
    </div>
  );
}
