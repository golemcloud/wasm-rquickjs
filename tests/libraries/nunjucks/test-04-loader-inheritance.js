import assert from 'assert';
import nunjucks from 'nunjucks';

class DictLoader extends nunjucks.Loader {
  constructor(templates) {
    super();
    this.templates = templates;
  }

  getSource(name) {
    if (!(name in this.templates)) {
      return null;
    }

    return {
      src: this.templates[name],
      path: name,
      noCache: true,
    };
  }
}

export const run = () => {
  const templates = {
    'base.njk': 'Base:{% block content %}{% endblock %}',
    'child.njk': '{% extends "base.njk" %}{% block content %}Hello {{ name }}{% endblock %}',
    'partial.njk': '{{ value | upper }}',
    'with-include.njk': 'Start-{% include "partial.njk" %}-End',
  };

  const env = new nunjucks.Environment(new DictLoader(templates));

  const inherited = env.render('child.njk', { name: 'Loader' });
  const included = env.render('with-include.njk', { value: 'piece' });

  assert.strictEqual(inherited, 'Base:Hello Loader');
  assert.strictEqual(included, 'Start-PIECE-End');
  return 'PASS: custom loader supports extends and include rendering';
};
