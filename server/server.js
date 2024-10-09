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
    sender: User!
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
    sendMessage(chatId: ID!, body: String!): Message!
  }

  type Subscription {
    newMessage(chatId: ID!): Message!
  }
`;

const resolvers = {
  Query: {
    messages: async (_, { chatId }) => {
      const messages = await db.all('SELECT * FROM messages WHERE chatId = ?', [chatId]);
      return Promise.all(messages.map(async (message) => {
        const user = await db.get('SELECT * FROM users WHERE id = ?', [message.senderName]); // Fetch user details
        return {
          ...message,
          sender: user, // Add the user object to the message
        };
      }));
    },
    availableUsers: async () => {
      return await db.all('SELECT * FROM users');
    },
    chats: async (_, { userId }) => {
      const chatsData = await db.all(`
        SELECT c.id, c.lastMessage, c.timestamp, u.id AS userId, u.name, u.avatar
        FROM chat_users cu
        JOIN chats c ON cu.chatId = c.id
        JOIN users u ON cu.userId = u.id
        WHERE cu.userId = ?
      `, [userId]);
      console.log('chatsData:', chatsData, 'userId:', userId);

      const groupedChats = chatsData.reduce((acc, chat) => {
        const { id, lastMessage, timestamp, userId, name, avatar } = chat;
        if (!acc[id]) {
          acc[id] = {
            id,
            lastMessage,
            timestamp,
            users: [],
          };
        }
        acc[id].users.push({ id: userId, name, avatar });
        return acc;
      }, {});

      return Object.values(groupedChats);
    },
  },
  Mutation: {
    sendMessage: async (_, { chatId, body, userId }) => {
      const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]); // Fetch user details
      const newMessage = {
        chatId,
        sender: user, // Use the full user object
        body,
        timestamp: new Date().toISOString(),
      };
      await db.run('INSERT INTO messages (chatId, senderName, body, timestamp) VALUES (?, ?, ?, ?)', 
        [newMessage.chatId, newMessage.sender.id, newMessage.body, newMessage.timestamp]);
      return newMessage;
    },
  },
  Subscription: {
    newMessage: {
      subscribe: (_, { chatId }, { pubsub }) => pubsub.asyncIterator(`NEW_MESSAGE_${chatId}`),
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
      senderName TEXT,
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

  console.log('Users:', users);
  console.log('chat_users:', chat_users);
  console.log('Chats:', chats);
}

async function startServer() {
  await initDatabase(); 
  await logTableContents(); // Log the table contents after seeding
  const app = express();
  const server = new ApolloServer({ typeDefs, resolvers });

  await server.start();
  server.applyMiddleware({ app });

  const PORT = 4000;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer();