import assert from 'assert';
import { ApolloServer } from '@apollo/server';

export const run = async () => {
  const server = new ApolloServer({
    typeDefs: `#graphql
      type Query {
        boom: String!
      }
    `,
    resolvers: {
      Query: {
        boom: () => {
          throw new Error('database unavailable');
        },
      },
    },
    formatError: (formattedError) => ({
      ...formattedError,
      message: 'masked resolver failure',
    }),
    stopOnTerminationSignals: false,
  });

  const response = await server.executeOperation({ query: '{ boom }' });

  assert.strictEqual(response.body.kind, 'single');
  const { errors } = response.body.singleResult;
  assert.ok(errors && errors.length === 1, 'expected exactly one GraphQL error');
  assert.strictEqual(errors[0].message, 'masked resolver failure');
  assert.strictEqual(errors[0].extensions.code, 'INTERNAL_SERVER_ERROR');

  await server.stop();
  return 'PASS: formatError transforms resolver errors';
};
