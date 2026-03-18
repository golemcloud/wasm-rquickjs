import assert from 'assert';
import nunjucks from 'nunjucks';

export const run = () => {
  const env = new nunjucks.Environment([]);

  const macroAndLoop = env.renderString(`
{%- macro label(name) -%}[{{ name | upper }}]{%- endmacro -%}
{%- for user in users -%}
  {%- if user.active -%}{{ label(user.name) }}{%- endif -%}
{%- endfor -%}
`, {
    users: [
      { name: 'alice', active: true },
      { name: 'bob', active: false },
      { name: 'carol', active: true },
    ],
  });

  const builtInTest = env.renderString('{% if value is divisibleby(3) %}divisible{% else %}nope{% endif %}', {
    value: 12,
  });

  assert.strictEqual(macroAndLoop, '[ALICE][CAROL]');
  assert.strictEqual(builtInTest, 'divisible');
  return 'PASS: control flow, macros, and built-in tests render correctly';
};
