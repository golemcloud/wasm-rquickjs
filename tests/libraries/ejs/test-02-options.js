import assert from 'assert';
import ejs from 'ejs';

export const run = () => {
  const template = '<%= user.name %> -> <%= amount + fee %>';
  const compiled = ejs.compile(template, {
    _with: false,
    strict: true,
    localsName: 'ctx',
    destructuredLocals: ['user', 'amount', 'fee'],
  });

  const output = compiled({ user: { name: 'Alice' }, amount: 8, fee: 2 });
  assert.strictEqual(output, 'Alice -> 10');

  const escaped = ejs.escapeXML("\"<>&'");
  assert.strictEqual(escaped, '&#34;&lt;&gt;&amp;&#39;');

  return 'PASS: compile options and escapeXML behave correctly';
};
