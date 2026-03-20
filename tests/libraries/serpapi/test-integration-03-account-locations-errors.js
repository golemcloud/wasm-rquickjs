import assert from 'assert';
import { getAccount, getJson, getLocations } from 'serpapi';
import { withMockHttpTransport } from './integration-helpers.js';

export const run = async () =>
  withMockHttpTransport(async () => {
    const account = await getAccount({ api_key: 'test-serpapi-key' });
    const locations = await getLocations({ q: 'Austin', limit: 1 });

    assert.strictEqual(account.account_id, 'acct_test_001');
    assert.strictEqual(locations.length, 1);
    assert.strictEqual(locations[0].canonical_name, 'Austin,Texas,United States');

    await assert.rejects(
      getJson({ engine: 'google', api_key: 'bad-key', q: 'unauthorized' }),
      /Invalid API key/,
    );

    return 'PASS: account/locations succeed and HTTP auth errors are propagated';
  });
