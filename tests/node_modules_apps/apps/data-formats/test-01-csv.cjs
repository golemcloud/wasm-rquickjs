const assert = require('node:assert');
const Papa = require('papaparse');
const { parse } = require('csv-parse/sync');

exports.run = () => {
  const csv = 'name,count\na,1\nb,2\n';
  const papa = Papa.parse(csv, { header: true, dynamicTyping: true, skipEmptyLines: true });
  assert.deepStrictEqual(papa.data, [{ name: 'a', count: 1 }, { name: 'b', count: 2 }]);
  const parsed = parse(csv, { columns: true, cast: true });
  assert.deepStrictEqual(parsed, [{ name: 'a', count: 1 }, { name: 'b', count: 2 }]);
  return 'PASS: CSV parsers execute from installed packages';
};
