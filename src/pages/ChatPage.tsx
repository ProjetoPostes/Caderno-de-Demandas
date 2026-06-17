import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ChatContactList } from "@/components/chat/ChatContactList";
import { ChatConversation } from "@/components/chat/ChatConversation";
import { useChat } from "@/hooks/useChat";
import { useChatUsers } from "@/hooks/useChatUsers";
import { ChatContact } from "@/types/chat";

export default function ChatPage() {
  const navigate = useNavigate();
  const { users, isLoading: isLoadingUsers } = useChatUsers();
  const {
    activeContactId,
    isLoading,
    isLoadingHistory,
    selectContact,
    getMessages,
    sendMessage,
    cumuloContact,
  } = useChat();

  // Find the active contact
  const activeContact: ChatContact | null = useMemo(() => {
    if (!activeContactId) return null;
    if (activeContactId === 'cumulo') return cumuloContact;
    return users.find(u => u.id === activeContactId) || null;
  }, [activeContactId, cumuloContact, users]);

  const messages = activeContactId ? getMessages(activeContactId) : [];

  const handleSendMessage = (message: string) => {
    if (activeContactId) {
      sendMessage(activeContactId, message);
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b flex items-center px-4 gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Chat</h1>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <ChatContactList
          cumuloContact={cumuloContact}
          users={users}
          activeContactId={activeContactId}
          onSelectContact={selectContact}
          isLoading={isLoadingUsers}
        />

        <ChatConversation
          contact={activeContact}
          messages={messages}
          isLoading={isLoading}
          isLoadingHistory={isLoadingHistory}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
