import assert from 'assert';
import { Liquid } from 'liquidjs';

export const run = async () => {
  const engine = new Liquid();
  const output = await engine.parseAndRender(
    'Hello, {{ user.name | upcase }}! You have {{ count | plus: 2 }} tasks.',
    { user: { name: 'ada' }, count: 3 }
  );

  assert.strictEqual(output, 'Hello, ADA! You have 5 tasks.');
  return 'PASS: parseAndRender handles interpolation and built-in filters';
};
