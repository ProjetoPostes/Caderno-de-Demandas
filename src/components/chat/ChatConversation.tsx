import { ChatContact, ChatMessage } from "@/types/chat";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";

interface ChatConversationProps {
  contact: ChatContact | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isLoadingHistory?: boolean;
  onSendMessage: (message: string) => void;
}

export function ChatConversation({
  contact,
  messages,
  isLoading,
  isLoadingHistory,
  onSendMessage,
}: ChatConversationProps) {
  const isAutomation = contact?.type === 'automation';

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <ChatHeader contact={contact} />
      
      {contact ? (
        <>
          <ChatMessageList 
            messages={messages} 
            isLoading={isLoading} 
            isLoadingHistory={isLoadingHistory}
            isAutomation={isAutomation}
          />
          <ChatInput
            onSend={onSendMessage}
            disabled={isLoading}
            placeholder={
              isAutomation
                ? "Envie uma mensagem para o Cúmulo..."
                : `Envie uma mensagem para ${contact.name}...`
            }
          />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Selecione uma conversa para começar
        </div>
      )}
    </div>
  );
}
