import { gql } from '@apollo/client';

export const SEND_MESSAGE_MUTATION = gql`
  mutation SendMessage($chatId: ID!, $body: String!) {
    sendMessage(chatId: $chatId, body: $body) {
      id
      senderName
      body
      timestamp
    }
  }
`;