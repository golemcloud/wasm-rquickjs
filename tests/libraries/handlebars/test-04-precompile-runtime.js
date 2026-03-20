import assert from 'assert';
import Handlebars from 'handlebars';

export const run = () => {
  const source = 'ID={{id}} {{#if active}}ACTIVE{{else}}INACTIVE{{/if}}';
  const specText = Handlebars.precompile(source);
  const spec = new Function(`return (${specText});`)();
  const template = Handlebars.template(spec);

  const active = template({ id: 7, active: true });
  const inactive = template({ id: 8, active: false });

  assert.strictEqual(active, 'ID=7 ACTIVE');
  assert.strictEqual(inactive, 'ID=8 INACTIVE');
  return 'PASS: precompile + template runtime rendering works';
};
