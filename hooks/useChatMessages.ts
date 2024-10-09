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
      if (newMessage.sender.id !== currentUser.id) {
        // TODO: check if this logic is a good one taking into account that the user may have multiple devices and the app has a web version
        await addMessageToDb(newMessage, true);
        setMessages(await loadMessages());
      }
    };

    subscribeToNewMessages(handleNewMessage);
  }, [subscribeToNewMessages, currentUser.id, addMessageToDb, loadMessages]);

  useEffect(() => {
    syncUnsentMessages();
  }, [syncUnsentMessages]);

  const sendMessage = useCallback(async (body: string) => {
    const optimisticMessage: Message = {
      id: Date.now().toString(),
      sender: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
      },
      body,
      timestamp: new Date().toISOString(),
      synced: false,
    };
    await addMessageToDb(optimisticMessage, false);
    setMessages(await loadMessages());
  }, [currentUser, addMessageToDb, loadMessages]);

  return { messages, sendMessage, currentUser };
}