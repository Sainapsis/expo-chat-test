import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/types/types';
import { useChatMessageLocalDb } from './useChatMessageLocalDb';
import { useChatMessageServerSync } from './useChatMessageServerSync';
import { useChatMessageSubscription } from './useChatMessageSubscription';
import { useCurrentUser } from './useCurrentUser';

const TRUNCATE_LOCAL_DB_MESSAGES_ON_ENTER = false;

export function useChatMessages(chatId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const { loadMessages, addMessageToDb, initializeChatTable, truncateMessages } = useChatMessageLocalDb(chatId);
  const { syncUnsentMessages } = useChatMessageServerSync(chatId);
  const { subscribeToNewMessages } = useChatMessageSubscription(chatId);
  const { currentUser } = useCurrentUser();

  useEffect(() => {
    console.log('Initializing chat table and loading messages for chatId:', chatId);
    initializeChatTable().then(async () => {
      console.log('Chat table initialized');
      if (TRUNCATE_LOCAL_DB_MESSAGES_ON_ENTER) {
        console.log('Truncating messages before loading');
        await truncateMessages();
      }
      console.log('Now loading messages');
      loadMessages().then(loadedMessages => {
        console.log('Messages loaded:', loadedMessages);
        setMessages(loadedMessages);
        console.log('Messages state updated');
      });
    });
  }, [initializeChatTable, loadMessages, truncateMessages]);

  useEffect(() => {
    const unsubscribe = subscribeToNewMessages((newMessage: Message) => {
      if (newMessage.sender.id !== currentUser.id) {
        addMessageToDb(newMessage, true).then(() => {
          setMessages(prevMessages => [...prevMessages, newMessage]);
        });
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [subscribeToNewMessages, currentUser.id, addMessageToDb]);

  useEffect(() => {
    syncUnsentMessages();
  }, [syncUnsentMessages]);

  const sendMessage = useCallback(async (body: string) => {
    const optimisticMessage: Message = {
      id: Date.now().toString(),
      sender: currentUser,
      body,
      timestamp: new Date().toISOString(),
      synced: false,
    };
    await addMessageToDb(optimisticMessage, false);
    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
    await syncUnsentMessages();
  }, [currentUser, addMessageToDb, syncUnsentMessages]);

  return { messages, sendMessage, currentUser };
}