import { useCallback } from 'react';
import { useSubscription } from '@apollo/client';
import { NEW_MESSAGE_SUBSCRIPTION } from '@/graphql/subscriptions';
import { Message } from '@/types/chat';

export function useChatMessageSubscription(chatId: string) {
  const subscribeToNewMessages = useCallback((onNewMessage: (message: Message) => void) => {
    const { unsubscribe } = useSubscription(NEW_MESSAGE_SUBSCRIPTION, {
      variables: { chatId },
      onData: ({ data }) => {
        const newMessage = data.data.newMessage;
        onNewMessage(newMessage);
      },
    });
    return unsubscribe;
  }, [chatId]);

  return { subscribeToNewMessages };
}