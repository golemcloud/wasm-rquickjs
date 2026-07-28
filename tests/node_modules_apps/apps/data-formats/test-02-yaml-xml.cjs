const assert = require('node:assert');
const YAML = require('yaml');
const { parseStringPromise, Builder } = require('xml2js');

exports.run = async () => {
  const parsedYaml = YAML.parse('name: installed-app\nitems:\n  - one\n  - two\n');
  assert.deepStrictEqual(parsedYaml, { name: 'installed-app', items: ['one', 'two'] });
  assert.match(YAML.stringify(parsedYaml), /installed-app/);

  const parsedXml = await parseStringPromise('<root><item id="1">one</item></root>', { explicitArray: false });
  assert.strictEqual(parsedXml.root.item._, 'one');
  assert.strictEqual(parsedXml.root.item.$.id, '1');
  const xml = new Builder({ headless: true }).buildObject({ root: { item: 'two' } });
  assert.match(xml, /<item>two<\/item>/);
  return 'PASS: YAML and XML parsers execute from installed packages';
};
