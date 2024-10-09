import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_CHATS } from '@/graphql/queries';
import { useCurrentUserStore } from '@/store/useCurrentUserStore';
import { ChatListResponse, ChatItem } from '@/types/types';

export function useChats() {
  const { currentUser } = useCurrentUserStore();
  const { data, loading, error, refetch } = useQuery<ChatListResponse>(GET_CHATS, {
    variables: { userId: currentUser?.id },
    skip: !currentUser?.id,
  });

  const [chats, setChats] = useState<ChatItem[]>([]);

  useEffect(() => {
    if (currentUser?.id) {
      refetch({ userId: currentUser.id });
      console.info('refetching chats from useEffect for user:', currentUser.id);
    }
  }, [currentUser, refetch]);

  useEffect(() => {
    console.info('useChats data:', data);
    if (data && data.chats) {
      setChats(data.chats);
    }
  }, [data]);

  return { chats, loading, error };
}