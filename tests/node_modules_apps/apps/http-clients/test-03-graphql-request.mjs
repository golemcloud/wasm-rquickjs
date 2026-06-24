import assert from 'node:assert';
import { GraphQLClient, gql } from 'graphql-request';

export const run = async () => {
  const client = new GraphQLClient('https://example.invalid/graphql', {
    fetch: async (_url, init) => {
      assert.match(String(init.body), /hello/);
      return new Response(JSON.stringify({ data: { hello: 'world' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });
  const data = await client.request(gql`query { hello }`);
  assert.deepStrictEqual(data, { hello: 'world' });
  return 'PASS: graphql-request builds and executes with a custom fetch from node_modules';
};
