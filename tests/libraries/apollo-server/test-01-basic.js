import assert from 'assert';
import { ApolloServer } from '@apollo/server';

export const run = async () => {
  const server = new ApolloServer({
    typeDefs: `#graphql
      type Query {
        greet(name: String!): String!
      }
    `,
    resolvers: {
      Query: {
        greet: (_root, { name }) => `Hello, ${name}!`,
      },
    },
    stopOnTerminationSignals: false,
  });

  const response = await server.executeOperation({
    query: 'query SayHi($name: String!) { greet(name: $name) }',
    variables: { name: 'Apollo' },
  });

  assert.strictEqual(response.body.kind, 'single');
  assert.strictEqual(response.body.singleResult.data?.greet, 'Hello, Apollo!');

  await server.stop();
  return 'PASS: executeOperation runs a basic query';
};
