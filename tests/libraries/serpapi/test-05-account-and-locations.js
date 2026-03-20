import assert from 'assert';
import { config, getAccount, getLocations } from 'serpapi';
import { resetConfig, withMockHttpsGet } from './helpers.js';

export const run = async () => {
  resetConfig();
  config.api_key = 'global-test-key';

  let callbackLocations;

  const values = await withMockHttpsGet(
    [
      {
        statusCode: 200,
        body: JSON.stringify({ account_id: 'acct_123', plan_name: 'developer' }),
      },
      {
        statusCode: 200,
        body: JSON.stringify([
          { canonical_name: 'Austin,Texas,United States', target_type: 'city' },
        ]),
      },
    ],
    async (calls) => {
      const account = await getAccount();
      const locations = await getLocations({ q: 'Austin', limit: 1 }, (rows) => {
        callbackLocations = rows;
      });
      return { calls, account, locations };
    },
  );

  assert.strictEqual(values.calls.length, 2);
  assert.ok(values.calls[0].path.startsWith('/account?'));
  assert.ok(values.calls[0].path.includes('api_key=global-test-key'));
  assert.ok(values.calls[1].path.startsWith('/locations.json?'));
  assert.ok(values.calls[1].path.includes('q=Austin'));
  assert.ok(values.calls[1].path.includes('limit=1'));

  assert.strictEqual(values.account.plan_name, 'developer');
  assert.strictEqual(values.locations[0].canonical_name, 'Austin,Texas,United States');
  assert.strictEqual(callbackLocations[0].target_type, 'city');

  resetConfig();
  return 'PASS: getAccount uses configured API key and getLocations works without key validation';
};
