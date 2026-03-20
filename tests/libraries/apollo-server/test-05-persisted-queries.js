import assert from 'assert';
import { ApolloServer } from '@apollo/server';

const query = '{ hello }';
const queryHash = '001c3174e099bd72b729d0c0a529ba9f5a740c446e2a6e1d71b283cb84ec3065';

export const run = async () => {
  const server = new ApolloServer({
    typeDefs: `#graphql
      type Query {
        hello: String!
      }
    `,
    resolvers: {
      Query: {
        hello: () => 'world',
      },
    },
    persistedQueries: true,
    stopOnTerminationSignals: false,
  });

  const miss = await server.executeOperation({
    extensions: { persistedQuery: { version: 1, sha256Hash: queryHash } },
  });
  assert.strictEqual(miss.body.kind, 'single');
  assert.strictEqual(miss.body.singleResult.errors[0].extensions.code, 'PERSISTED_QUERY_NOT_FOUND');

  const register = await server.executeOperation({
    query,
    extensions: { persistedQuery: { version: 1, sha256Hash: queryHash } },
  });
  assert.strictEqual(register.body.kind, 'single');
  assert.strictEqual(register.body.singleResult.data?.hello, 'world');

  const hit = await server.executeOperation({
    extensions: { persistedQuery: { version: 1, sha256Hash: queryHash } },
  });
  assert.strictEqual(hit.body.kind, 'single');
  assert.strictEqual(hit.body.singleResult.data?.hello, 'world');

  await server.stop();
  return 'PASS: automatic persisted queries (APQ) miss and hit flow works';
};
