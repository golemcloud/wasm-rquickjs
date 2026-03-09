import assert from 'assert';
import { buildSchema, parse, validate } from 'graphql';

export const run = () => {
  const schema = buildSchema(`
    type Query {
      value: Int!
    }
  `);

  const document = parse('{ missingField }');
  const errors = validate(schema, document);

  assert.ok(errors.length > 0, 'Expected at least one validation error');
  assert.match(errors[0].message, /Cannot query field "missingField" on type "Query"/);

  return 'PASS: validate reports schema/query mismatches';
};
