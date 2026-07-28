const assert = require('node:assert');
const ejs = require('ejs');
const handlebars = require('handlebars');
const mustache = require('mustache');

exports.run = () => {
  assert.strictEqual(ejs.render('Hello <%= name %>', { name: 'EJS' }), 'Hello EJS');

  const hb = handlebars.compile('Hello {{name}} {{#if ok}}OK{{/if}}');
  assert.strictEqual(hb({ name: 'Handlebars', ok: true }), 'Hello Handlebars OK');

  assert.strictEqual(mustache.render('Hello {{name}}', { name: 'Mustache' }), 'Hello Mustache');
  return 'PASS: template engines execute from installed packages';
};
