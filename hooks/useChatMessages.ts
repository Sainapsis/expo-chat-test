import { useState, useEffect } from 'react';
import { Message } from '@/types/chat';

export function useChatMessages(chatId: string | string[]) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const mockMessages: Message[] = [
      { id: '1', senderName: 'Alice', body: 'Hey there!' },
      { id: '2', senderName: 'Bob', body: 'Hi Alice, how are you?' },
      { id: '3', senderName: 'Alice', body: 'Im doing great, thanks for asking!' },
      { id: '4', senderName: 'Bob', body: 'Thats wonderful to hear!' },
    ];

    // Simulate API delay
    setTimeout(() => {
      setMessages(mockMessages);
    }, 500);
  }, [chatId]);

  return { messages };
}