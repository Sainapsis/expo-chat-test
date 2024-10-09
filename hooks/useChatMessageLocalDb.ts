import { useCallback } from 'react';
import * as SQLite from 'expo-sqlite';
import { Message } from '@/types/types';

const db = SQLite.openDatabaseAsync('chat.db');

export function useChatMessageLocalDb(chatId: string) {
  const initializeChatTable = useCallback(async () => {
    const database = await db;
    await database.execAsync(
      'CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, chatId TEXT, senderName TEXT, body TEXT, timestamp TEXT, synced INTEGER)'
    );
  }, [chatId]);

  const loadMessages = useCallback(async () => {
    const database = await db;
    return await database.getAllAsync<Message>(
      'SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp DESC',
      [chatId]
    );
  }, [chatId]);

  const addMessageToDb = useCallback(async (message: Message, synced: boolean) => {
    const database = await db;
    await database.runAsync(
      'INSERT OR REPLACE INTO messages (id, chatId, senderName, body, timestamp, synced) VALUES (?, ?, ?, ?, ?, ?)',
      [message.id, chatId, message.sender.id, message.body, message.timestamp, synced ? 1 : 0]
    );
  }, [chatId]);

  const updateMessageInDb = useCallback(async (message: Message) => {
    const database = await db;
    await database.runAsync(
      'UPDATE messages SET senderName = ?, body = ?, timestamp = ?, synced = ? WHERE id = ?',
      [message.sender.id, message.body, message.timestamp, message.synced ? 1 : 0, message.id]
    );
  }, [chatId]);

  const getUnsyncedMessages = useCallback(async () => {
    const database = await db;
    return await database.getAllAsync<Message>(
      'SELECT * FROM messages WHERE chatId = ? AND synced = 0',
      [chatId]
    );
  }, [chatId]);

  return { initializeChatTable, loadMessages, addMessageToDb, updateMessageInDb, getUnsyncedMessages };
}