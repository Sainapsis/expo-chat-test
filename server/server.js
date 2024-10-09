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
      const chatsData = await db.all('SELECT * FROM chats WHERE id IN (SELECT chatId FROM messages WHERE senderName = ?)', [userId]);
      console.log('chatsData:', chatsData, 'userId:', userId);
      return chatsData.map(chat => ({
        ...chat,
        users: chat.users.map(id => db.get('SELECT * FROM users WHERE id = ?', [id])),
      }));
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

  for (const user of usersData) {
    await db.run('INSERT OR IGNORE INTO users (id, name, avatar) VALUES (?, ?, ?)', [user.id, user.name, user.avatar]);
  }

  for (const chat of chatsData) {
    await db.run('INSERT OR IGNORE INTO chats (id, lastMessage, timestamp) VALUES (?, ?, ?)', [chat.id, chat.lastMessage, chat.timestamp]);
  }
}

async function logTableContents() {
  const users = await db.all('SELECT * FROM users');
  const messages = await db.all('SELECT * FROM messages');
  const chats = await db.all('SELECT * FROM chats');

  console.log('Users:', users);
  console.log('Messages:', messages);
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