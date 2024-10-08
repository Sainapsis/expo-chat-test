// User-related types
export interface User {
  id: string;
  name: string;
  avatar: string;
}

// Message-related types
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  timestamp: string;
  synced: boolean;
}

// Chat-related types
export interface ChatItem {
  id: string;
  users: User[];
  lastMessage: Message;
  timestamp: string;
}

// Server response types
export interface ChatListResponse {
  chats: ChatItem[];
}

export interface ChatDetailsResponse {
  chat: ChatItem;
  messages: Message[];
}

export interface SendMessageResponse {
  message: Message;
}
