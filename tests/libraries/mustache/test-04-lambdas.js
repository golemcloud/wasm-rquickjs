import assert from 'assert';
import Mustache from 'mustache';

export const run = () => {
  const template = '{{#upper}}hello {{name}}{{/upper}}';
  const view = {
    name: 'mustache',
    upper() {
      return (text, render) => render(text).toUpperCase();
    },
  };

  const out = Mustache.render(template, view);
  assert.strictEqual(out, 'HELLO MUSTACHE');

  return 'PASS: lambda sections receive raw text and render callback correctly';
};
