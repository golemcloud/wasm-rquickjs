import assert from 'assert';
import { getHtmlBySearchId, getJsonBySearchId } from 'serpapi';
import { resetConfig, withMockHttpsGet } from './helpers.js';

export const run = async () => {
  resetConfig();

  const archivedJson = { search_metadata: { id: 'archive-123', status: 'Cached' } };
  const archivedHtml = '<html><body>Archived HTML</body></html>';

  const responses = await withMockHttpsGet(
    [
      { statusCode: 200, body: JSON.stringify(archivedJson) },
      { statusCode: 200, body: archivedHtml },
    ],
    async (calls) => {
      const json = await getJsonBySearchId('archive-123', { api_key: 'test-key' });
      const html = await getHtmlBySearchId('archive-123', { api_key: 'test-key' });
      return { calls, json, html };
    },
  );

  assert.strictEqual(responses.calls.length, 2);
  assert.ok(responses.calls[0].path.startsWith('/searches/archive-123?'));
  assert.ok(responses.calls[0].path.includes('output=json'));
  assert.ok(responses.calls[1].path.startsWith('/searches/archive-123?'));
  assert.ok(responses.calls[1].path.includes('output=html'));

  assert.strictEqual(responses.json.search_metadata.id, 'archive-123');
  assert.strictEqual(responses.html, archivedHtml);

  resetConfig();
  return 'PASS: archived search helpers request /searches/{id} for JSON and HTML output';
};
