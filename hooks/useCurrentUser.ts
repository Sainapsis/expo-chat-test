import { useState, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import { User } from '@/types/user';

const GET_AVAILABLE_USERS = gql`
  query GetAvailableUsers {
    availableUsers {
      id
      name
      avatar
    }
  }
`;

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<User>({ id: '1', name: 'Alice', avatar: 'https://i.pravatar.cc/150?img=1' });
  const { data } = useQuery<{ availableUsers: User[] }>(GET_AVAILABLE_USERS);

  const changeUser = (userId: string) => {
    const newUser = data?.availableUsers.find(user => user.id === userId);
    if (newUser) {
      setCurrentUser(newUser);
    }
  };

  return { currentUser, changeUser, availableUsers: data?.availableUsers || [] };
}