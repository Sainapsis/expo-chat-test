import { gql } from '@apollo/client';

export const GET_CHATS = gql`
  query GetChats($userId: ID!) {
    chats(userId: $userId) {
      id
      users {
        id
        name
        avatar
      }
      lastMessage
      timestamp
    }
  }
`;
