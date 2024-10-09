import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { GET_AVAILABLE_USERS } from '@/graphql/queries';
import { User } from '@/types/types';

export function useUsers() {
  const [users, setUsers] = useState<Record<string, User>>({});
  const { data, loading, error } = useQuery(GET_AVAILABLE_USERS);

  useEffect(() => {
    if (data && data.availableUsers) {
      const userMap = data.availableUsers.reduce((acc: Record<string, User>, user: User) => {
        acc[user.id] = user;
        return acc;
      }, {});
      setUsers(userMap);
    }
  }, [data]);

  const getUserName = useCallback((userId: string) => {
    return users[userId]?.name || 'Unknown User';
  }, [users]);

  const getUserAvatar = useCallback((userId: string) => {
    return users[userId]?.avatar || '';
  }, [users]);

  return { users, getUserName, getUserAvatar, loading, error };
}