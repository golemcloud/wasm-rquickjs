import assert from 'assert';
import { createHmac } from 'node:crypto';
import { Client } from 'typesense';

const client = new Client({
  nodes: [{ host: 'localhost', port: 8108, protocol: 'http' }],
  apiKey: 'test-api-key',
  randomizeNodes: false,
});

const manualScopedKey = (searchKey, parameters) => {
  const paramsJSON = JSON.stringify(parameters);
  const digest = Buffer.from(createHmac('sha256', searchKey).update(paramsJSON).digest('base64'));
  const keyPrefix = searchKey.slice(0, 4);
  const rawScopedKey = `${digest}${keyPrefix}${paramsJSON}`;
  return Buffer.from(rawScopedKey).toString('base64');
};

export const run = () => {
  const searchKey = 'RN23GFr1s6jQ9kgSNg2O7fYcAUXU7127';
  const params = {
    filter_by: 'tenant_id:=42 && published:=true',
    expires_at: 1700000000,
  };

  const generated = client.keys().generateScopedSearchKey(searchKey, params);
  const expected = manualScopedKey(searchKey, params);
  assert.strictEqual(generated, expected);

  const decoded = Buffer.from(generated, 'base64').toString('utf8');
  assert.ok(decoded.includes(searchKey.slice(0, 4)));

  return 'PASS: scoped search key generation matches HMAC reference implementation';
};
