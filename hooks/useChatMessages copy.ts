import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/types/chat';
import * as SQLite from 'expo-sqlite';
import { gql, useSubscription, useMutation } from '@apollo/client';

const clearDb = false;
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
        if(clearDb) {
          console.warn('truncation of table messages');
          await database.execAsync('DELETE FROM messages');
        }
        await database.execAsync(
          'CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, chatId TEXT, senderName TEXT, body TEXT, timestamp TEXT, synced INTEGER)'
        );
        console.info('Table alrerady existed or was created successfully');
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

  useSubscription(NEW_MESSAGE_SUBSCRIPTION, {
    variables: { chatId },
    onData: async ({ data }) => {
      const database = await db;
      const newMessage = data.data.newMessage;
      console.log('new message from subscription', newMessage);
      if (newMessage.senderName !== currentUserName) {
        const existingMessage = await database.getFirstAsync<Message>(
          'SELECT * FROM messages WHERE id = ?',
          [newMessage.id]
        );
        if (!existingMessage) {
          console.info('new message from subscription will be added to db', newMessage);
          await addMessageToDb(newMessage, true);
          await loadMessages();
        } else {
          console.info('new message from subscription ignored because it is already in db', newMessage);
        }
      }
    },
  });

  const [sendMessageMutation] = useMutation(SEND_MESSAGE_MUTATION);

  const addMessageToDb = useCallback(async (message: Message, synced: boolean) => {
    const database = await db;
    await database.runAsync(
      'INSERT OR REPLACE INTO messages (id, chatId, senderName, body, timestamp, synced) VALUES (?, ?, ?, ?, ?, ?)',
      [message.id, chatId, message.senderName, message.body, message.timestamp, synced || message.synced ? 1 : 0]
    );
    console.info('message added to db', message);
  }, [chatId]);

  //TODO: get current user's name from the server, move this logic to a global state
  const [currentUserName, setCurrentUserName] = useState('Me');

  const sendMessage = useCallback(async (body: string) => {
    const optimisticMessage: Message = {
      id: Date.now().toString(),
      senderName: currentUserName,
      body,
      timestamp: new Date().toISOString(),
      synced: false
    };
    console.info('optimistic message added to db', optimisticMessage);
    await addMessageToDb(optimisticMessage, false);
    await loadMessages();
  }, [chatId, sendMessageMutation, currentUserName, loadMessages]);

  // Sync unsent messages
  useEffect(() => {
    const syncUnsentMessages = async () => {
      const database = await db;
      const unsentMessages = await database.getAllAsync<Message>(
        'SELECT * FROM messages WHERE chatId = ? AND synced = 0',
        [chatId]
      );
      for (const message of unsentMessages) {
        console.info('syncing unsent message', message);
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
  }, [chatId, sendMessageMutation, loadMessages]);

const updateMessageInDb = async (message: Message, isSent: boolean) => {
  try {
    const database = await db;
    const query = `
      UPDATE messages
      SET senderName = ?, body = ?, timestamp = ?, synced = ?
      WHERE id = ?
    `;
    const params = [message.senderName, message.body, message.timestamp, message.synced ? 1 : 0, message.id];
    await database.runAsync(query, params);
    console.info('Message updated in db', message);
    await loadMessages();
  } catch (error) {
    console.error('Error updating message in database:', error);
  }
};

  return { messages, sendMessage, currentUserName };
}