import { useState, useCallback, useEffect, useRef } from "react";
import { ChatContact, ChatMessage, ChatConversationsMap, ChatFile } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const CUMULO_CONTACT: ChatContact = {
  id: "cumulo",
  name: "Cúmulo",
  type: "automation",
};

export function useChat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversationsMap>({});
  const [activeContactId, setActiveContactId] = useState<string | null>("cumulo");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Track pending message IDs to avoid duplicates from realtime
  const pendingMessageIds = useRef<Set<string>>(new Set());

  // Load messages from database for a specific contact
  const loadMessages = useCallback(async (contactId: string) => {
    if (!user) return;

    setIsLoadingHistory(true);
    try {
      // For Cúmulo, query only by recipient_id since sender_id is always user
      // This avoids the UUID type error with 'cumulo' string
      let query;
      if (contactId === "cumulo") {
        query = supabase
          .from("chat_messages")
          .select("*")
          .eq("sender_id", user.id)
          .eq("recipient_id", "cumulo")
          .order("created_at", { ascending: true });
      } else {
        // For user-to-user chat
        query = supabase
          .from("chat_messages")
          .select("*")
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${contactId}),and(sender_id.eq.${contactId},recipient_id.eq.${user.id})`)
          .order("created_at", { ascending: true });
      }

      const { data, error } = await query;

      if (error) throw error;

      const messages: ChatMessage[] = (data || []).map((msg) => {
        // Check if this is a Cúmulo response (marked with special prefix)
        const isCumuloResponse = msg.content?.startsWith("[CUMULO_RESPONSE]");
        const content = isCumuloResponse 
          ? msg.content.replace("[CUMULO_RESPONSE]", "") 
          : msg.content;
        
        // For Cúmulo conversations: if it's a Cúmulo response, it's from "other"
        const isFromUser = contactId === "cumulo" 
          ? !isCumuloResponse 
          : msg.sender_id === user.id;

        // Parse file data if present
        let file: ChatFile | null = null;
        if (msg.file) {
          try {
            file = typeof msg.file === 'string' ? JSON.parse(msg.file) : msg.file as ChatFile;
          } catch {
            file = null;
          }
        }

        return {
          id: msg.id,
          content,
          sender: isFromUser ? "user" : "other",
          timestamp: new Date(msg.created_at),
          status: msg.status as ChatMessage["status"],
          file,
        };
      });

      setConversations((prev) => ({
        ...prev,
        [contactId]: messages,
      }));
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  // Load messages when active contact changes
  useEffect(() => {
    if (activeContactId && user) {
      loadMessages(activeContactId);
    }
  }, [activeContactId, user, loadMessages]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("chat-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const newMessage = payload.new as {
            id: string;
            sender_id: string;
            recipient_id: string;
            content: string;
            status: string;
            created_at: string;
            file: unknown;
          };

          // Skip if this message was sent by us and we're tracking it
          if (pendingMessageIds.current.has(newMessage.id)) {
            pendingMessageIds.current.delete(newMessage.id);
            return;
          }

          // Check if this is a Cúmulo response
          const isCumuloResponse = newMessage.content?.startsWith("[CUMULO_RESPONSE]");
          const content = isCumuloResponse 
            ? newMessage.content.replace("[CUMULO_RESPONSE]", "") 
            : newMessage.content;

          // Determine which conversation this message belongs to
          let conversationId: string;

          if (newMessage.recipient_id === "cumulo") {
            conversationId = "cumulo";
          } else if (newMessage.sender_id === user.id) {
            conversationId = newMessage.recipient_id;
          } else if (newMessage.recipient_id === user.id) {
            conversationId = newMessage.sender_id;
          } else {
            // Message not for this user
            return;
          }

          // For Cúmulo: skip user messages (we add them locally), only handle responses
          if (conversationId === "cumulo" && !isCumuloResponse) {
            return;
          }

          // Parse file data if present
          let file: ChatFile | null = null;
          if (newMessage.file) {
            console.log('Received file from realtime:', newMessage.file);
            try {
              file = typeof newMessage.file === 'string' 
                ? JSON.parse(newMessage.file) 
                : newMessage.file as ChatFile;
              console.log('Parsed file:', { 
                name: file?.name, 
                hasData: !!file?.data,
                dataLength: file?.data?.length 
              });
            } catch (e) {
              console.error('Error parsing file:', e);
              file = null;
            }
          }

          const chatMessage: ChatMessage = {
            id: newMessage.id,
            content,
            sender: isCumuloResponse ? "other" : (newMessage.sender_id === user.id ? "user" : "other"),
            timestamp: new Date(newMessage.created_at),
            status: newMessage.status as ChatMessage["status"],
            file,
          };

          // Add message, avoiding duplicates
          setConversations((prev) => {
            const existing = prev[conversationId] || [];
            if (existing.some((m) => m.id === chatMessage.id)) {
              return prev;
            }
            return {
              ...prev,
              [conversationId]: [...existing, chatMessage],
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const selectContact = useCallback((contactId: string) => {
    setActiveContactId(contactId);
  }, []);

  const getMessages = useCallback(
    (contactId: string): ChatMessage[] => {
      return conversations[contactId] || [];
    },
    [conversations]
  );

  const addLocalMessage = useCallback((contactId: string, message: ChatMessage) => {
    setConversations((prev) => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), message],
    }));
  }, []);

  const updateMessageStatus = useCallback(
    (contactId: string, messageId: string, status: ChatMessage["status"]) => {
      setConversations((prev) => ({
        ...prev,
        [contactId]: (prev[contactId] || []).map((msg) =>
          msg.id === messageId ? { ...msg, status } : msg
        ),
      }));
    },
    []
  );

  const updateMessageId = useCallback(
    (contactId: string, tempId: string, newId: string) => {
      setConversations((prev) => ({
        ...prev,
        [contactId]: (prev[contactId] || []).map((msg) =>
          msg.id === tempId ? { ...msg, id: newId } : msg
        ),
      }));
    },
    []
  );

  const saveMessageToDb = useCallback(
    async (recipientId: string, content: string, status: string = "sent") => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content,
          status,
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving message:", error);
        return null;
      }

      return data;
    },
    [user]
  );

  const sendMessageToCumulo = useCallback(
    async (message: string): Promise<{ response?: string; file?: ChatFile } | null> => {
      if (!user) return null;

      try {
        const { data, error } = await supabase.functions.invoke("chat-cumulo", {
          body: {
            message,
            user_id: user.id,
          },
        });

        if (error) throw error;

        return {
          response: data?.response || "",
          file: data?.file || null,
        };
      } catch (error) {
        console.error("Erro ao enviar mensagem para Cúmulo:", error);
        throw error;
      }
    },
    [user]
  );

  const sendMessage = useCallback(
    async (contactId: string, content: string) => {
      if (!content.trim() || !user) return;

      const tempId = crypto.randomUUID();
      const userMessage: ChatMessage = {
        id: tempId,
        content: content.trim(),
        sender: "user",
        timestamp: new Date(),
        status: contactId === "cumulo" ? "sending" : "sent",
      };

      // Add message locally first for instant feedback
      addLocalMessage(contactId, userMessage);

      // Save user message to database
      const savedMessage = await saveMessageToDb(contactId, content.trim(), userMessage.status);

      if (savedMessage) {
        // Track this message ID to avoid duplicate from realtime
        pendingMessageIds.current.add(savedMessage.id);
        // Update the temp message with the real ID
        updateMessageId(contactId, tempId, savedMessage.id);
      }

      // If sending to Cúmulo, call the edge function
      if (contactId === "cumulo") {
        setIsLoading(true);
        try {
          const result = await sendMessageToCumulo(content);

          // Update user message status
          if (savedMessage) {
            updateMessageStatus(contactId, savedMessage.id, "sent");
          }

          // The Cúmulo response will be added via realtime subscription
          // No need to add locally anymore - this was causing duplicates
          
          if (!result?.response && !result?.file) {
            toast.info("Cúmulo não retornou uma resposta");
          }
        } catch (error) {
          if (savedMessage) {
            updateMessageStatus(contactId, savedMessage.id, "error");
          }
          toast.error("Erro ao enviar mensagem para o Cúmulo");
        } finally {
          setIsLoading(false);
        }
      }
    },
    [user, addLocalMessage, saveMessageToDb, updateMessageStatus, updateMessageId, sendMessageToCumulo]
  );

  return {
    conversations,
    activeContactId,
    isLoading,
    isLoadingHistory,
    selectContact,
    getMessages,
    sendMessage,
    cumuloContact: CUMULO_CONTACT,
  };
}
