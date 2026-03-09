import assert from 'assert';
import { buildSchema, graphqlSync } from 'graphql';

export const run = () => {
  const schema = buildSchema(`
    type Query {
      hello(name: String!): String!
      answer: Int!
    }
  `);

  const rootValue = {
    hello: ({ name }) => `Hello, ${name}!`,
    answer: () => 42,
  };

  const result = graphqlSync({
    schema,
    source: '{ hello(name: "GraphQL") answer }',
    rootValue,
  });

  assert.strictEqual(result.errors, undefined);
  assert.strictEqual(result.data.hello, 'Hello, GraphQL!');
  assert.strictEqual(result.data.answer, 42);

  return 'PASS: graphqlSync executes a basic query';
};
