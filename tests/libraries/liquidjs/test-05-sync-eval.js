import assert from 'assert';
import { Liquid } from 'liquidjs';

export const run = () => {
  const engine = new Liquid({ strictVariables: true });

  const parsed = engine.parse('{{ user.name | upcase }}-{{ qty | plus: 1 }}');
  const rendered = engine.renderSync(parsed, { user: { name: 'ada' }, qty: 2 });
  assert.strictEqual(rendered, 'ADA-3');

  const value = engine.evalValueSync('price | minus: discount', {
    price: 19,
    discount: 4,
  });
  assert.strictEqual(value, 15);

  let threw = false;
  try {
    engine.parseAndRenderSync('Hello {{ missing }}', {});
  } catch (_error) {
    threw = true;
  }
  assert.strictEqual(threw, true, 'strictVariables should throw on undefined values');

  return 'PASS: sync parse/render and evalValue APIs behave as expected';
};
