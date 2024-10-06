const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');

// Define your GraphQL schema
const typeDefs = gql`
  type Message {
    id: ID!
    chatId: ID!
    senderName: String!
    body: String!
    timestamp: String!
  }

  type Query {
    messages(chatId: ID!): [Message!]!
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
const resolvers = {
  Query: {
    messages: (_, { chatId }) => messages.filter(message => message.chatId === chatId),
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