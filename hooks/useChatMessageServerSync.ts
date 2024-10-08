import { useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { SEND_MESSAGE_MUTATION } from '@/graphql/mutations';
import { useChatMessageLocalDb } from './useChatMessageLocalDb';
import { Message } from '@/types/types';
export function useChatMessageServerSync(chatId: string) {
  const [sendMessageMutation] = useMutation(SEND_MESSAGE_MUTATION);
  const { getUnsyncedMessages, addMessageToDb } = useChatMessageLocalDb(chatId);

  const syncUnsentMessages = useCallback(async () => {
    const unsentMessages = await getUnsyncedMessages();
    for (const message of unsentMessages) {
      try {
        const { data } = await sendMessageMutation({
          variables: { chatId, body: message.body },
        });
        await addMessageToDb(data.sendMessage, true);
      } catch (error) {
        console.error('Failed to sync message:', error);
      }
    }
  }, [chatId, sendMessageMutation, addMessageToDb]);

  return { syncUnsentMessages };
}