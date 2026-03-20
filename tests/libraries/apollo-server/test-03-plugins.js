import assert from 'assert';
import { ApolloServer } from '@apollo/server';

export const run = async () => {
  const events = [];

  const server = new ApolloServer({
    typeDefs: `#graphql
      type Query {
        ping: String!
      }
    `,
    resolvers: {
      Query: {
        ping: () => 'pong',
      },
    },
    plugins: [
      {
        async serverWillStart() {
          events.push('serverWillStart');
          return {
            async serverWillStop() {
              events.push('serverWillStop');
            },
          };
        },
        async requestDidStart() {
          events.push('requestDidStart');
          return {
            async didResolveOperation() {
              events.push('didResolveOperation');
            },
            async willSendResponse() {
              events.push('willSendResponse');
            },
          };
        },
      },
    ],
    stopOnTerminationSignals: false,
  });

  const response = await server.executeOperation({ query: '{ ping }' });
  assert.strictEqual(response.body.kind, 'single');
  assert.strictEqual(response.body.singleResult.data?.ping, 'pong');

  await server.stop();

  assert.ok(events.includes('serverWillStart'));
  assert.ok(events.includes('requestDidStart'));
  assert.ok(events.includes('didResolveOperation'));
  assert.ok(events.includes('willSendResponse'));
  assert.ok(events.includes('serverWillStop'));

  return 'PASS: plugin lifecycle hooks execute around a request';
};
