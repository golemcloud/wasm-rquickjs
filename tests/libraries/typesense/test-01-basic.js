import assert from 'assert';
import { Client, Errors, SearchClient } from 'typesense';

const makeConfig = () => ({
  nodes: [{ host: 'localhost', port: 8108, protocol: 'http' }],
  apiKey: 'test-api-key',
  randomizeNodes: false,
  connectionTimeoutSeconds: 2,
});

export const run = () => {
  const client = new Client(makeConfig());
  assert.strictEqual(typeof client.collections, 'function');
  assert.strictEqual(typeof client.multiSearch.perform, 'function');
  assert.strictEqual(typeof client.health.retrieve, 'function');
  assert.strictEqual(typeof client.keys().generateScopedSearchKey, 'function');

  const searchClient = new SearchClient(makeConfig());
  assert.strictEqual(typeof searchClient.collections, 'function');
  assert.strictEqual(typeof searchClient.multiSearch.perform, 'function');
  assert.strictEqual(typeof searchClient.clearCache, 'function');

  // SearchClient defaults this to true so scoped keys can be used from browser clients.
  assert.strictEqual(searchClient.configuration.sendApiKeyAsQueryParam, true);

  assert.strictEqual(typeof Errors.TypesenseError, 'function');
  assert.strictEqual(typeof Errors.ObjectNotFound, 'function');
  assert.strictEqual(typeof Errors.ObjectAlreadyExists, 'function');

  return 'PASS: Client/SearchClient constructors and exported APIs are available';
};
