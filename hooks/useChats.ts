import { useState, useEffect } from 'react';
import { User } from '@/types/user';

interface Chat {
  id: string;
  user: User;
  lastMessage: string;
  timestamp: string;
}

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    const mockedChats: Chat[] = [
      { id: '1', user: { id: '1', name: 'Alice', avatar: 'https://i.pravatar.cc/150?img=1' }, lastMessage: 'Hey, how are you?', timestamp: '10:30 AM' },
      { id: '2', user: { id: '2', name: 'Bob', avatar: 'https://i.pravatar.cc/150?img=2' }, lastMessage: 'Did you see the new movie?', timestamp: '9:45 AM' },
      { id: '3', user: { id: '3', name: 'Charlie', avatar: 'https://i.pravatar.cc/150?img=3' }, lastMessage: 'Meeting at 2 PM today', timestamp: 'Yesterday' },
      { id: '4', user: { id: '4', name: 'Diana', avatar: 'https://i.pravatar.cc/150?img=4' }, lastMessage: 'Thanks for your help!', timestamp: 'Yesterday' },
      { id: '5', user: { id: '5', name: 'Ethan', avatar: 'https://i.pravatar.cc/150?img=5' }, lastMessage: 'Let\'s catch up soon', timestamp: '2 days ago' },
    ];

    setChats(mockedChats);
  }, []);

  return chats;
}