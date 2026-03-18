import assert from 'assert';
import { Liquid } from 'liquidjs';

export const run = async () => {
  const engine = new Liquid();
  const template = [
    '{% for item in items limit:3 %}',
    '[{{ forloop.index }}:{{ item | upcase }}]',
    '{% else %}EMPTY{% endfor %}',
    '{% unless enabled %}-OFF{% endunless %}'
  ].join('');

  const output = await engine.parseAndRender(template, {
    items: ['a', 'b', 'c', 'd'],
    enabled: false,
  });

  assert.strictEqual(output, '[1:A][2:B][3:C]-OFF');
  return 'PASS: control-flow tags (for, forloop, unless) render correctly';
};
