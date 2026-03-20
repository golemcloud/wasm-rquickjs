import assert from 'assert';
import { parse, print, visit } from 'graphql';

export const run = () => {
  const doc = parse(`
    query UserInfo {
      user {
        id
        name
        email
      }
    }
  `);

  const transformed = visit(doc, {
    Field(node) {
      if (node.name.value === 'email') {
        return null;
      }
      return undefined;
    },
  });

  const printed = print(transformed);

  assert.ok(printed.includes('name'));
  assert.ok(!printed.includes('email'));
  assert.ok(printed.includes('query UserInfo'));

  return 'PASS: parse/visit/print transforms the AST as expected';
};
