import assert from 'assert';
import { getHtmlBySearchId, getJsonBySearchId } from 'serpapi';
import { withMockHttpTransport } from './integration-helpers.js';

export const run = async () =>
  withMockHttpTransport(async () => {
    const json = await getJsonBySearchId('archive-abc', { api_key: 'test-serpapi-key' });
    const html = await getHtmlBySearchId('archive-abc', { api_key: 'test-serpapi-key' });

    assert.strictEqual(json.search_metadata.id, 'archive-abc');
    assert.strictEqual(json.search_metadata.status, 'Cached');
    assert.ok(html.includes('Archived HTML for archive-abc'));

    return 'PASS: archive lookup APIs fetch JSON and HTML over HTTP from mock endpoint';
  });
