import { useCallback } from 'react';
import * as SQLite from 'expo-sqlite';
import { Message } from '@/types/types';

const db = SQLite.openDatabaseAsync('chat.db');

export function useChatMessageLocalDb(chatId: string) {
  const initializeChatTable = useCallback(async () => {
    const database = await db;
    await database.execAsync(
      'CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, chatId TEXT, senderId TEXT, body TEXT, timestamp TEXT, synced INTEGER)'
    );
  }, [chatId]);

  const loadMessages = useCallback(async () => {
    const database = await db;
    const messages = await database.getAllAsync<Message>(
      'SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp DESC',
      [chatId]
    );
    console.log('Messages loaded from local db for chatId:', chatId, messages);
    return messages;
  }, [chatId]);

  const addMessageToDb = useCallback(async (message: Message, synced: boolean) => {
    const database = await db;
    await database.runAsync(
      'INSERT OR REPLACE INTO messages (id, chatId, senderId, body, timestamp, synced) VALUES (?, ?, ?, ?, ?, ?)',
      [message.id, chatId, message.senderId, message.body, message.timestamp, synced ? 1 : 0]
    );
  }, [chatId]);

  const updateMessageInDb = useCallback(async (message: Message) => {
    const database = await db;
    await database.runAsync(
      'UPDATE messages SET senderId = ?, body = ?, timestamp = ?, synced = ? WHERE id = ?',
      [message.senderId, message.body, message.timestamp, message.synced ? 1 : 0, message.id]
    );
  }, [chatId]);

  const updateMessageSyncStatus = useCallback(async (messageId: string, synced: boolean) => {
    const database = await db;
    await database.runAsync(
      'UPDATE messages SET synced = ? WHERE id = ?',
      [synced ? 1 : 0, messageId]
    );
  }, []);

  const getUnsyncedMessages = useCallback(async () => {
    const database = await db;
    return await database.getAllAsync<Message>(
      'SELECT * FROM messages WHERE chatId = ? AND synced = 0',
      [chatId]
    );
  }, [chatId]);

  const truncateMessages = useCallback(async () => {
    console.log('Truncating messages table for chatId:', chatId);
    const database = await db;
    await database.runAsync('DELETE FROM messages WHERE chatId = ?', [chatId]);
    console.log('Messages table truncated for chatId:', chatId);
  }, [chatId]);

  return { 
    initializeChatTable, 
    loadMessages, 
    addMessageToDb, 
    updateMessageInDb, 
    getUnsyncedMessages,
    updateMessageSyncStatus,
    truncateMessages 
  };
}