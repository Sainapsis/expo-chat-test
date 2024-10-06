import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/types/chat';
import * as SQLite from 'expo-sqlite';
import { gql, useSubscription, useMutation } from '@apollo/client';
import { useSocket } from '@/hooks/useSocket';

const db = SQLite.openDatabase('chat.db');

const NEW_MESSAGE_SUBSCRIPTION = gql`
  subscription NewMessage($chatId: ID!) {
    newMessage(chatId: $chatId) {
      id
      senderName
      body
      timestamp
    }
  }
`;

const SEND_MESSAGE_MUTATION = gql`
  mutation SendMessage($chatId: ID!, $body: String!) {
    sendMessage(chatId: $chatId, body: $body) {
      id
      senderName
      body
      timestamp
    }
  }
`;

export function useChatMessages(chatId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const socket = useSocket();

  // Initialize database
  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, chatId TEXT, senderName TEXT, body TEXT, timestamp TEXT, synced INTEGER)'
      );
    });
  }, []);

  // Load messages from SQLite
  const loadMessages = useCallback(() => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp DESC',
        [chatId],
        (_, { rows }) => {
          setMessages(rows._array);
        }
      );
    });
  }, [chatId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Subscribe to new messages
  useSubscription(NEW_MESSAGE_SUBSCRIPTION, {
    variables: { chatId },
    onSubscriptionData: ({ subscriptionData }) => {
      const newMessage = subscriptionData.data.newMessage;
      addMessageToDb(newMessage, true);
    },
  });

  // Mutation for sending messages
  const [sendMessageMutation] = useMutation(SEND_MESSAGE_MUTATION);

  // Add message to SQLite database
  const addMessageToDb = useCallback((message: Message, synced: boolean) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT OR REPLACE INTO messages (id, chatId, senderName, body, timestamp, synced) VALUES (?, ?, ?, ?, ?, ?)',
        [message.id, chatId, message.senderName, message.body, message.timestamp, synced ? 1 : 0],
        () => {
          loadMessages();
        }
      );
    });
  }, [chatId, loadMessages]);

  // Send message function
  const sendMessage = useCallback(async (body: string) => {
    const optimisticMessage: Message = {
      id: Date.now().toString(),
      senderName: 'Me', // Replace with actual user name
      body,
      timestamp: new Date().toISOString(),
    };

    // Add message optimistically
    addMessageToDb(optimisticMessage, false);

    try {
      const { data } = await sendMessageMutation({
        variables: { chatId, body },
      });

      // Update the message with the actual ID from the server
      addMessageToDb(data.sendMessage, true);
    } catch (error) {
      console.error('Failed to send message:', error);
      // You might want to mark the message as failed to send
    }
  }, [chatId, sendMessageMutation, addMessageToDb]);

  // Sync unsent messages
  useEffect(() => {
    const syncUnsentMessages = async () => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM messages WHERE chatId = ? AND synced = 0',
          [chatId],
          async (_, { rows }) => {
            for (let i = 0; i < rows.length; i++) {
              const message = rows.item(i);
              try {
                const { data } = await sendMessageMutation({
                  variables: { chatId, body: message.body },
                });
                addMessageToDb(data.sendMessage, true);
              } catch (error) {
                console.error('Failed to sync message:', error);
              }
            }
          }
        );
      });
    };

    syncUnsentMessages();
  }, [chatId, sendMessageMutation, addMessageToDb]);

  // Listen for real-time updates via socket
  useEffect(() => {
    if (socket) {
      socket.on('new_message', (message: Message) => {
        if (message.chatId === chatId) {
          addMessageToDb(message, true);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('new_message');
      }
    };
  }, [socket, chatId, addMessageToDb]);

  return { messages, sendMessage };
}