const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

exports.run = () => {
  const envPath = path.join(process.cwd(), 'fixtures', 'sample.env');
  fs.mkdirSync(path.dirname(envPath), { recursive: true });
  fs.writeFileSync(envPath, 'APP_NAME=installed-app\nAPP_COUNT=42\n');
  const parsed = dotenv.config({ path: envPath, processEnv: {} });
  assert.deepStrictEqual(parsed.parsed, { APP_NAME: 'installed-app', APP_COUNT: '42' });
  assert.deepStrictEqual(dotenv.parse(Buffer.from('A=1\nB=two\n')), { A: '1', B: 'two' });
  return 'PASS: dotenv reads configuration files from the attached filesystem';
};
