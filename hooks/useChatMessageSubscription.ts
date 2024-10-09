import { useCallback } from 'react';
import { useSubscription } from '@apollo/client';
import { NEW_MESSAGE_SUBSCRIPTION } from '@/graphql/subscriptions';
import { Message } from '@/types/types';

export function useChatMessageSubscription(chatId: string) {
  const { data, loading, error } = useSubscription<{ newMessage: Message }>(NEW_MESSAGE_SUBSCRIPTION, {
    variables: { chatId },
  });

  const subscribeToNewMessages = useCallback((onNewMessage: (message: Message) => void) => {
    if (data && data.newMessage) {
      onNewMessage(data.newMessage);
    }
  }, [data]);

  return { subscribeToNewMessages, loading, error };
}