import assert from 'assert';
import { buildClientSchema, buildSchema, introspectionFromSchema, printSchema } from 'graphql';

export const run = () => {
  const schema = buildSchema(`
    type Book {
      id: ID!
      title: String!
    }

    type Query {
      books: [Book!]!
    }
  `);

  const introspection = introspectionFromSchema(schema);
  const rebuiltSchema = buildClientSchema(introspection);
  const printedSchema = printSchema(rebuiltSchema);

  assert.ok(printedSchema.includes('type Query'));
  assert.ok(printedSchema.includes('books: [Book!]!'));
  assert.ok(printedSchema.includes('type Book'));

  return 'PASS: introspection utilities round-trip schema definitions';
};
