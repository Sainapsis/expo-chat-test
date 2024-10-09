import { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_AVAILABLE_USERS } from '@/graphql/queries';
import { User } from '@/types/types';
import { useCurrentUserStore } from '@/store/useCurrentUserStore';

export function useCurrentUser() {
  const { currentUser, setCurrentUser } = useCurrentUserStore();
  const { data } = useQuery<{ availableUsers: User[] }>(GET_AVAILABLE_USERS);

  useEffect(() => {
    if (data?.availableUsers && !currentUser) {
      // Set the first available user as the default current user
      setCurrentUser(data.availableUsers[0]);
    }
  }, [data, currentUser, setCurrentUser]);

  const changeUser = (userId: string) => {
    const newUser = data?.availableUsers.find(user => user.id === userId);
    if (newUser) {
      setCurrentUser(newUser);
      console.info('current user changed to:', newUser);
    }
  };

  return { currentUser, changeUser, availableUsers: data?.availableUsers || [] };
}