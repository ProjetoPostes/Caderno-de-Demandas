import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatContact } from "@/types/chat";
import { ChatContactItem } from "./ChatContactItem";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatContactListProps {
  cumuloContact: ChatContact;
  users: ChatContact[];
  activeContactId: string | null;
  onSelectContact: (contactId: string) => void;
  isLoading?: boolean;
}

export function ChatContactList({
  cumuloContact,
  users,
  activeContactId,
  onSelectContact,
  isLoading,
}: ChatContactListProps) {
  return (
    <div className="w-72 border-r bg-muted/30 flex flex-col h-full min-h-0">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Conversas</h2>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Cúmulo always first */}
          <ChatContactItem
            contact={cumuloContact}
            isActive={activeContactId === cumuloContact.id}
            onClick={() => onSelectContact(cumuloContact.id)}
          />

          {/* Separator */}
          {users.length > 0 && (
            <div className="py-2">
              <div className="text-xs text-muted-foreground px-3 py-1">Usuários</div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <>
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </>
          )}

          {/* User contacts */}
          {!isLoading && users.map(user => (
            <ChatContactItem
              key={user.id}
              contact={user}
              isActive={activeContactId === user.id}
              onClick={() => onSelectContact(user.id)}
            />
          ))}

          {/* Empty state */}
          {!isLoading && users.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-4">
              Nenhum usuário disponível
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
