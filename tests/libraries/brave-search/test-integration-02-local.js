import assert from 'assert';
import { createClient, setBaseUrl } from './helpers.js';

const client = createClient('test-brave-key');
setBaseUrl(client, 'http://localhost:18080/res/v1');

export const run = async () => {
  const poiResponse = await client.localPoiSearch(['poi-1', 'poi-2']);
  assert.strictEqual(poiResponse.results.length, 2);
  assert.strictEqual(poiResponse.results[0].id, 'poi-1');
  assert.strictEqual(poiResponse.results[1].name, 'POI poi-2');

  const descriptionsResponse = await client.localDescriptionsSearch(['poi-1']);
  assert.strictEqual(descriptionsResponse.descriptions.length, 1);
  assert.strictEqual(descriptionsResponse.descriptions[0].id, 'poi-1');
  assert.strictEqual(
    descriptionsResponse.descriptions[0].description,
    'Description for poi-1'
  );

  return 'PASS: local POI and description endpoints work against HTTP mock server';
};
