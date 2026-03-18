import assert from 'assert';
import iconv from 'iconv-lite';
import * as nodeStream from 'node:stream';
import { fromURL } from 'cheerio';

iconv.enableStreamingAPI(nodeStream);

const BASE = 'http://localhost:18080';

export const run = async () => {
  const $ = await fromURL(`${BASE}/page`);

  assert.strictEqual($('h1').text(), 'Mock Title');
  assert.strictEqual($('#count').text(), '42');
  assert.strictEqual($('a.next').prop('href'), '/docs/start');

  return 'PASS: fromURL loads HTML from a mock server';
};
