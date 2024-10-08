const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');

// Define your GraphQL schema
const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    avatar: String!
  }

  type Message {
    id: ID!
    chatId: ID!
    senderName: String!
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

// In-memory storage for messages
const messages = [];

// Define your resolvers
const users = [
  { id: '1', name: 'Alice', avatar: 'https://i.pravatar.cc/150?img=1' },
  { id: '2', name: 'Bob', avatar: 'https://i.pravatar.cc/150?img=2' },
  { id: '3', name: 'Charlie', avatar: 'https://i.pravatar.cc/150?img=3' },
  { id: '4', name: 'Diana', avatar: 'https://i.pravatar.cc/150?img=4' },
  { id: '5', name: 'Ethan', avatar: 'https://i.pravatar.cc/150?img=5' },
];

const chats = [
  { id: '1', users: ['1', '2'], lastMessage: 'Hey, how are you?', timestamp: '10:30 AM' },
  { id: '2', users: ['1', '3', '4'], lastMessage: 'Meeting at 2 PM today', timestamp: 'Yesterday' },
  { id: '3', users: ['1', '5'], lastMessage: 'Let\'s catch up soon', timestamp: '2 days ago' },
  { id: '4', users: ['2', '3'], lastMessage: 'Did you see the new movie?', timestamp: '9:45 AM' },
  { id: '5', users: ['4', '5'], lastMessage: 'Thanks for your help!', timestamp: 'Yesterday' },
];

const resolvers = {
  Query: {
    messages: (_, { chatId }) => messages.filter(message => message.chatId === chatId),
    availableUsers: () => users,
    chats: (_, { userId }) => {
      return chats
        .filter(chat => chat.users.includes(userId))
        .map(chat => ({
          ...chat,
          users: chat.users.map(id => users.find(user => user.id === id)),
        }));
    },
  },
  Mutation: {
    sendMessage: (_, { chatId, body }) => {
      const newMessage = {
        id: String(messages.length + 1),
        chatId,
        senderName: 'User', // You can replace this with actual user authentication
        body,
        timestamp: new Date().toISOString(),
      };
      messages.push(newMessage);
      return newMessage;
    },
  },
  Subscription: {
    newMessage: {
      subscribe: (_, { chatId }, { pubsub }) => pubsub.asyncIterator(`NEW_MESSAGE_${chatId}`),
    },
  },
};

async function startServer() {
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