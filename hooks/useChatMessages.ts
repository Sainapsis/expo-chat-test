import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/types/types';
import { useChatMessageLocalDb } from './useChatMessageLocalDb';
import { useChatMessageServerSync } from './useChatMessageServerSync';
import { useChatMessageSubscription } from './useChatMessageSubscription';
import { useCurrentUser } from './useCurrentUser';

export function useChatMessages(chatId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const { loadMessages, addMessageToDb, initializeChatTable } = useChatMessageLocalDb(chatId);
  const { syncUnsentMessages } = useChatMessageServerSync(chatId);
  const { subscribeToNewMessages } = useChatMessageSubscription(chatId);
  const { currentUser } = useCurrentUser();

  useEffect(() => {
    initializeChatTable().then(() => loadMessages().then(setMessages));
  }, [initializeChatTable, loadMessages]);

  useEffect(() => {
    const handleNewMessage = async (newMessage: Message) => {
      if (newMessage.senderName !== currentUser.name) {
        await addMessageToDb(newMessage, true);
        setMessages(await loadMessages());
      }
    };

    subscribeToNewMessages(handleNewMessage);
  }, [subscribeToNewMessages, currentUser.name, addMessageToDb, loadMessages]);

  useEffect(() => {
    syncUnsentMessages();
  }, [syncUnsentMessages]);

  const sendMessage = useCallback(async (body: string) => {
    const optimisticMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id, 
      senderName: currentUser.name,
      body,
      timestamp: new Date().toISOString(),
      synced: false
    };
    await addMessageToDb(optimisticMessage, false);
    setMessages(await loadMessages());
  }, [currentUser, addMessageToDb, loadMessages]);

  return { messages, sendMessage, currentUser };
}