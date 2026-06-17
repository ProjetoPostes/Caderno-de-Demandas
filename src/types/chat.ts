export interface ChatFile {
  name: string;
  type: string; // mime type
  data: string; // base64 or url
  size?: number;
}

export interface ChatContact {
  id: string;
  name: string;
  type: 'automation' | 'user';
  avatar_url?: string;
  role?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'other';
  timestamp: Date;
  status: 'sending' | 'sent' | 'error';
  file?: ChatFile | null;
}

export interface ChatConversation {
  contactId: string;
  messages: ChatMessage[];
}

export type ChatConversationsMap = Record<string, ChatMessage[]>;
