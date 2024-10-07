import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/types/chat';
import * as SQLite from 'expo-sqlite';
import { gql, useSubscription, useMutation } from '@apollo/client';

// Change this line to use openDatabaseAsync
const db = SQLite.openDatabaseAsync('chat.db');

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

  // Initialize database
  useEffect(() => {
    const createTable = async () => {
      try {
        const database = await db;
        await database.execAsync(
          'CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, chatId TEXT, senderName TEXT, body TEXT, timestamp TEXT, synced INTEGER)'
        );
        console.log('Table created successfully');
      } catch (error) {
        console.error('Error creating table:', error);
      }
    };

    createTable();
  }, []);

  // Load messages from SQLite
  const loadMessages = useCallback(async () => {
    const database = await db;
    const result = await database.getAllAsync<Message>(
      'SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp DESC',
      [chatId]
    );
    setMessages(result);
  }, [chatId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Subscribe to new messages
  useSubscription(NEW_MESSAGE_SUBSCRIPTION, {
    variables: { chatId },
    onData: ({ data }) => {
      const newMessage = data.data.newMessage;
      addMessageToDb(newMessage, true);
    },
  });

  // Mutation for sending messages
  const [sendMessageMutation] = useMutation(SEND_MESSAGE_MUTATION);

  // Add message to SQLite database
  const addMessageToDb = useCallback(async (message: Message, synced: boolean) => {
    const database = await db;
    await database.runAsync(
      'INSERT OR REPLACE INTO messages (id, chatId, senderName, body, timestamp, synced) VALUES (?, ?, ?, ?, ?, ?)',
      [message.id, chatId, message.senderName, message.body, message.timestamp, synced ? 1 : 0]
    );
    await loadMessages();
  }, [chatId, loadMessages]);

  // Send message function
  const sendMessage = useCallback(async (body: string) => {
    const optimisticMessage: Message = {
      id: Date.now().toString(),
      senderName: 'Me', // Replace with actual user name
      body,
      timestamp: new Date().toISOString(),
      synced: false
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
      const database = await db;
      const unsentMessages = await database.getAllAsync<Message>(
        'SELECT * FROM messages WHERE chatId = ? AND synced = 0',
        [chatId]
      );
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
    };

    syncUnsentMessages();
  }, [chatId, sendMessageMutation, addMessageToDb]);

  return { messages, sendMessage };
}