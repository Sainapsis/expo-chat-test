import { useCallback } from 'react';
import * as SQLite from 'expo-sqlite';
import { Message } from '@/types/types';

const db = SQLite.openDatabaseAsync('chat.db');
const DB_VERSION = 2;

export function useChatMessageLocalDb(chatId: string) {
  const initializeChatTable = useCallback(async () => {
    const database = await db;
    
    // Check current database version
    const versionResult = await database.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version'
    );
    const currentVersion = versionResult?.user_version || 0;
    if (currentVersion < DB_VERSION) {
      console.warn('Migrating database from version', currentVersion, 'to', DB_VERSION);
        await database.execAsync('DROP TABLE IF EXISTS messages');
        await database.execAsync(`
          CREATE TABLE messages (
            id TEXT PRIMARY KEY,
            chatId TEXT,
            senderId TEXT,
            body TEXT,
            timestamp TEXT,
            synced INTEGER,
            newColumn TEXT
          )
        `);
        await database.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
        const versionupdateResult = await database.getFirstAsync<{ version: number }>(
          'PRAGMA user_version'
        );
        console.info('Database migrated from version', currentVersion, 'to', versionupdateResult);
    }else{
      console.info('Database is up to date:', currentVersion);
    }
  }, []);

  const loadMessages = useCallback(async () => {
    const database = await db;
    const messages = await database.getAllAsync<Message>(
      'SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp DESC',
      [chatId]
    );
    return messages;
  }, [chatId]);

  const addMessageToDb = useCallback(async (message: Message, synced: boolean) => {
    const database = await db;
    try {
      const response = await database.runAsync(
        'INSERT OR REPLACE INTO messages (id, chatId, senderId, body, timestamp, synced) VALUES (?, ?, ?, ?, ?, ?)',
      [message.id, chatId, message.senderId, message.body, message.timestamp, synced ? 1 : 0]
      );
    } catch (error) {
      console.error('Error adding message to local db:', error);
    }
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
    const database = await db;
    await database.runAsync('DELETE FROM messages WHERE chatId = ?', [chatId]);
    console.warn('Messages table truncated for chatId:', chatId);
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