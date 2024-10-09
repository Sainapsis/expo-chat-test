export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Message {
  id: string;
  senderId: string;
  body: string;
  timestamp: string;
  synced: boolean;
}

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
