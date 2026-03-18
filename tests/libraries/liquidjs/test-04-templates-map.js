import assert from 'assert';
import { Liquid } from 'liquidjs';

export const run = async () => {
  const engine = new Liquid({
    templates: {
      'base.liquid': '<html><body>{% block content %}default{% endblock %}</body></html>',
      'card.liquid': '<section>{% render "name", value: user.name %}</section>',
      'name.liquid': '{{ value | upcase }}',
      'page.liquid': '{% layout "base" %}{% block content %}{% render "card", user: user %}{% endblock %}',
    },
    extname: '.liquid',
  });

  const output = await engine.renderFile('page', { user: { name: 'ada' } });
  assert.strictEqual(output, '<html><body><section>ADA</section></body></html>');

  return 'PASS: in-memory templates support layout and render includes without filesystem';
};
