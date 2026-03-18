import assert from 'assert';
import nunjucks from 'nunjucks';

export const run = () => {
  const env = new nunjucks.Environment([], { throwOnUndefined: true });

  const compiled = nunjucks.compile('Sum={{ a + b }}', env);
  const rendered = compiled.render({ a: 2, b: 3 });
  assert.strictEqual(rendered, 'Sum=5');

  let undefinedThrew = false;
  try {
    env.renderString('Missing={{ missing }}', {});
  } catch (error) {
    undefinedThrew = true;
    assert.ok(error instanceof Error);
    assert.match(String(error.message), /null or undefined|attempted to output/i);
  }
  assert.ok(undefinedThrew, 'throwOnUndefined should throw when rendering missing values');

  let syntaxThrew = false;
  try {
    env.renderString('{% if true %}unterminated', {});
  } catch (error) {
    syntaxThrew = true;
    assert.ok(error instanceof Error);
    assert.match(String(error.message), /expected elif, else, or endif|parseIf/i);
  }
  assert.ok(syntaxThrew, 'renderString should throw for malformed templates');

  return 'PASS: compile API works and runtime/parser errors are surfaced';
};
