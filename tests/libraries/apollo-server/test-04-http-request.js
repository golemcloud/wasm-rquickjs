import assert from 'assert';
import { ApolloServer, HeaderMap } from '@apollo/server';

export const run = async () => {
  const server = new ApolloServer({
    typeDefs: `#graphql
      type Query {
        version: String!
      }
    `,
    resolvers: {
      Query: {
        version: () => '1.0.0',
      },
    },
    stopOnTerminationSignals: false,
  });

  await server.start();

  const response = await server.executeHTTPGraphQLRequest({
    httpGraphQLRequest: {
      method: 'POST',
      headers: new HeaderMap([
        ['content-type', 'application/json'],
        ['apollo-require-preflight', 'true'],
      ]),
      search: '',
      body: { query: '{ version }' },
    },
    context: async () => ({}),
  });

  assert.strictEqual(response.body.kind, 'complete');
  const payload = JSON.parse(response.body.string);
  assert.strictEqual(payload.data?.version, '1.0.0');

  await server.stop();
  return 'PASS: executeHTTPGraphQLRequest handles POST requests without a real server';
};
