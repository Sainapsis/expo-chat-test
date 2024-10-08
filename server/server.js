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

  type Query {
    messages(chatId: ID!): [Message!]!
    availableUsers: [User!]!
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
];

const resolvers = {
  Query: {
    messages: (_, { chatId }) => messages.filter(message => message.chatId === chatId),
    availableUsers: () => users,
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