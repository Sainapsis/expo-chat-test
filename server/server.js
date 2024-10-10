const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    avatar: String!
  }

  type Message {
    id: ID!
    chatId: ID!
    senderId: ID!
    body: String!
    timestamp: String!
  }

  type Chat {
    id: ID!
    users: [User!]!
    lastMessage: String
    timestamp: String
  }

  type Query {
    messages(chatId: ID!): [Message!]!
    availableUsers: [User!]!
    chats(userId: ID!): [Chat!]!
  }

  type Mutation {
    sendMessage(chatId: ID!, senderId: ID!, body: String!, timestamp: String!): Message!
  }

  type Subscription {
    newMessage(chatId: ID!): Message!
  }
`;

const resolvers = {
  Query: {
    messages: async (_, { chatId }) => {
      const messages = await db.all('SELECT * FROM messages WHERE chatId = ?', [chatId]);
      return messages.map(message => ({
        id: message.id.toString(),
        chatId: message.chatId,
        senderId: message.senderId,
        body: message.body,
        timestamp: message.timestamp,
      }));
    },
    availableUsers: async () => {
      return await db.all('SELECT * FROM users');
    },
    chats: async (_, { userId }) => {
      // First, get all chats for the user
      const userChats = await db.all(`
        SELECT DISTINCT c.id, c.lastMessage, c.timestamp
        FROM chat_users cu
        JOIN chats c ON cu.chatId = c.id
        WHERE cu.userId = ?
      `, [userId]);

      // Then, for each chat, get all users
      const chatsWithUsers = await Promise.all(userChats.map(async (chat) => {
        const users = await db.all(`
          SELECT u.id, u.name, u.avatar
          FROM chat_users cu
          JOIN users u ON cu.userId = u.id
          WHERE cu.chatId = ?
        `, [chat.id]);

        return {
          ...chat,
          users
        };
      }));

      return chatsWithUsers;
    },
  },
  Mutation: {
    sendMessage: async (_, { chatId, senderId, body, timestamp }) => {
      console.log('Received sendMessage request:', { chatId, senderId, body, timestamp });
      const newMessage = {
        chatId,
        senderId,
        body,
        timestamp,
      };
      try {
        const result = await db.run('INSERT INTO messages (chatId, senderId, body, timestamp) VALUES (?, ?, ?, ?)', 
          [newMessage.chatId, newMessage.senderId, newMessage.body, newMessage.timestamp]);
        console.log('Message inserted successfully');
        newMessage.id = result.lastID.toString();
        return newMessage;
      } catch (error) {
        console.error('Error inserting message:', error);
        throw new Error('Failed to insert message');
      }
    },
  },
  Subscription: {
    newMessage: {
      subscribe: (_, { chatId }, { pubsub }) => {
        // Implement the logic to publish new messages
        // This is just a placeholder and needs to be properly implemented
        return pubsub.asyncIterator(`NEW_MESSAGE_${chatId}`);
      },
    },
  },
};

let db;

async function initDatabase() {
  db = await open({
    filename: './database.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      avatar TEXT
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chatId TEXT,
      senderId TEXT,
      body TEXT,
      timestamp TEXT
    );
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      lastMessage TEXT,
      timestamp TEXT
    );
    CREATE TABLE IF NOT EXISTS chat_users (
      chatId TEXT,
      userId TEXT,
      PRIMARY KEY (chatId, userId),
      FOREIGN KEY (chatId) REFERENCES chats(id),
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `);

  await seedDatabase();
}

async function seedDatabase() {
  const usersData = [
    { id: '1', name: 'Alice', avatar: 'https://i.pravatar.cc/150?img=1' },
    { id: '2', name: 'Bob', avatar: 'https://i.pravatar.cc/150?img=2' },
    { id: '3', name: 'Charlie', avatar: 'https://i.pravatar.cc/150?img=3' },
    { id: '4', name: 'Diana', avatar: 'https://i.pravatar.cc/150?img=4' },
    { id: '5', name: 'Ethan', avatar: 'https://i.pravatar.cc/150?img=5' },
  ];

  const chatsData = [
    { id: '1', lastMessage: 'Hey, how are you?', timestamp: '10:30 AM' },
    { id: '2', lastMessage: 'Meeting at 2 PM today', timestamp: 'Yesterday' },
    { id: '3', lastMessage: 'Let\'s catch up soon', timestamp: '2 days ago' },
    { id: '4', lastMessage: 'Did you see the new movie?', timestamp: '9:45 AM' },
    { id: '5', lastMessage: 'Thanks for your help!', timestamp: 'Yesterday' },
  ];

  const chatUsersData = [
    { chatId: '1', userId: '1' },
    { chatId: '1', userId: '2' },
    { chatId: '1', userId: '3' },
    { chatId: '1', userId: '4' },
    { chatId: '1', userId: '5' },
    { chatId: '2', userId: '1' },
    { chatId: '2', userId: '3' },
    { chatId: '3', userId: '2' },
    { chatId: '3', userId: '4' },
    { chatId: '4', userId: '1' },
    { chatId: '4', userId: '5' },
    { chatId: '5', userId: '3' },
    { chatId: '5', userId: '4' },
  ];

  for (const user of usersData) {
    await db.run('INSERT OR IGNORE INTO users (id, name, avatar) VALUES (?, ?, ?)', [user.id, user.name, user.avatar]);
  }

  for (const chat of chatsData) {
    await db.run('INSERT OR IGNORE INTO chats (id, lastMessage, timestamp) VALUES (?, ?, ?)', [chat.id, chat.lastMessage, chat.timestamp]);
  }

  for (const chatUser of chatUsersData) {
    await db.run('INSERT OR IGNORE INTO chat_users (chatId, userId) VALUES (?, ?)', [chatUser.chatId, chatUser.userId]);
  }
}

async function logTableContents() {
  const users = await db.all('SELECT * FROM users');
  const chat_users = await db.all('SELECT * FROM chat_users');
  const chats = await db.all('SELECT * FROM chats');

  //console.log('Users:', users);
  //console.log('chat_users:', chat_users);
  //console.log('Chats:', chats);
}

async function startServer() {
  await initDatabase(); 
  await logTableContents();
  const app = express();
  
  const server = new ApolloServer({ 
    typeDefs, 
    resolvers,
    context: ({ req }) => {
      // Add user authentication logic here
      // For now, we'll just use a mock user ID
      return { userId: '1' };
    },
  });

  await server.start();
  server.applyMiddleware({ app });

  const PORT = 4000;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer();