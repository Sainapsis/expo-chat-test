import { gql } from '@apollo/client';

export const SEND_MESSAGE_MUTATION = gql`
  mutation SendMessage($chatId: ID!, $senderId: ID!, $body: String!, $timestamp: String!) {
    sendMessage(chatId: $chatId, senderId: $senderId, body: $body, timestamp: $timestamp) {
      id
      chatId
      senderId
      body
      timestamp
    }
  }
`;