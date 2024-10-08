import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_CHATS } from '@/graphql/queries';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ChatListResponse, ChatItem } from '@/types/types';

export function useChats() {
  const { currentUser } = useCurrentUser();
  const { data, loading, error } = useQuery<ChatListResponse>(GET_CHATS, {
    variables: { userId: currentUser.id },
    skip: !currentUser.id,
  });

  const [chats, setChats] = useState<ChatItem[]>([]);

  useEffect(() => {
    if (data && data.chats) {
      setChats(data.chats);
    }
  }, [data]);

  return { chats, loading, error };
}