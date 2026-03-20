import assert from 'assert';
import Handlebars from 'handlebars';

export const run = () => {
  const strictTemplate = Handlebars.compile('{{missing.value}}', { strict: true });
  assert.throws(
    () => strictTemplate({}),
    (err) => String(err.message || err).includes('not defined'),
  );

  const base = Handlebars.compile('{{format amount}} {{currency}}');
  const output = base({ amount: 1234.56, currency: 'USD' }, {
    helpers: {
      format: (value) => Number(value).toFixed(2),
    },
  });

  assert.strictEqual(output, '1234.56 USD');
  return 'PASS: strict mode errors and per-render helper overrides work';
};
