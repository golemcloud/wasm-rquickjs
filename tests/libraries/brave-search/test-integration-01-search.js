import assert from 'assert';
import { createClient, setBaseUrl } from './helpers.js';

const client = createClient('test-brave-key');
setBaseUrl(client, 'http://localhost:18080/res/v1');

export const run = async () => {
  const web = await client.webSearch('golem wasm', {
    count: 2,
    text_decorations: false,
    spellcheck: true,
  });

  assert.strictEqual(web.query.original, 'golem wasm');
  assert.strictEqual(web.web.results.length, 1);
  assert.strictEqual(web.optionsEcho.count, '2');
  assert.strictEqual(web.optionsEcho.text_decorations, 'false');
  assert.strictEqual(web.optionsEcho.spellcheck, 'true');

  const images = await client.imageSearch('quickjs logo', { count: 1 });
  assert.strictEqual(images.query.original, 'quickjs logo');
  assert.strictEqual(images.results.length, 1);

  const news = await client.newsSearch('component model', { count: 1 });
  assert.strictEqual(news.query.original, 'component model');
  assert.strictEqual(news.results.length, 1);

  return 'PASS: web, image, and news search calls work against HTTP mock server';
};
