import { useState, useEffect } from 'react';

interface Chat {
  id: string;
  userName: string;
  lastMessage: string;
  timestamp: string;
}

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    const mockedChats: Chat[] = [
      { id: '1', userName: 'Alice', lastMessage: 'Hey, how are you?', timestamp: '10:30 AM' },
      { id: '2', userName: 'Bob', lastMessage: 'Did you see the new movie?', timestamp: '9:45 AM' },
      { id: '3', userName: 'Charlie', lastMessage: 'Meeting at 2 PM today', timestamp: 'Yesterday' },
      { id: '4', userName: 'Diana', lastMessage: 'Thanks for your help!', timestamp: 'Yesterday' },
      { id: '5', userName: 'Ethan', lastMessage: 'Let\'s catch up soon', timestamp: '2 days ago' },
    ];

    setChats(mockedChats);
  }, []);

  return chats;
}