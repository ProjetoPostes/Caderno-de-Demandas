import { cn } from "@/lib/utils";
import { ChatContact } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Sparkles } from "lucide-react";

interface ChatContactItemProps {
  contact: ChatContact;
  isActive: boolean;
  onClick: () => void;
}

const roleLabels: Record<string, string> = {
  admin: "Admin",
  operador_chefe: "Chefe",
  operador: "Operador",
  consultor: "Consultor",
};

export function ChatContactItem({ contact, isActive, onClick }: ChatContactItemProps) {
  const isAutomation = contact.type === 'automation';
  const initials = contact.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
        isActive
          ? "bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/30 shadow-sm"
          : "hover:bg-muted/60 border border-transparent",
        isAutomation && !isActive && "bg-gradient-to-r from-accent/10 to-transparent"
      )}
    >
      <div className="relative">
        <Avatar className={cn(
          "h-11 w-11 transition-transform group-hover:scale-105", 
          isActive && "ring-2 ring-primary/40"
        )}>
          {contact.avatar_url ? (
            <AvatarImage src={contact.avatar_url} alt={contact.name} />
          ) : null}
          <AvatarFallback className={cn(
            isAutomation 
              ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground" 
              : "bg-muted"
          )}>
            {isAutomation ? <Bot className="h-5 w-5" /> : initials || <User className="h-5 w-5" />}
          </AvatarFallback>
        </Avatar>
        {isAutomation && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-accent rounded-full p-0.5 shadow-sm">
            <Sparkles className="h-2.5 w-2.5 text-accent-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-medium truncate transition-colors",
            isActive && "text-primary"
          )}>
            {contact.name}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge 
            variant={isAutomation ? "default" : "secondary"} 
            className={cn(
              "text-[10px] px-2 py-0 font-medium",
              isAutomation && "bg-primary/90"
            )}
          >
            {isAutomation ? "IA" : roleLabels[contact.role || ''] || "Usuário"}
          </Badge>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          </span>
        </div>
      </div>
    </button>
  );
}
