import assert from 'assert';
import iconv from 'iconv-lite';
import * as nodeStream from 'node:stream';
import { fromURL } from 'cheerio';

iconv.enableStreamingAPI(nodeStream);

const BASE = 'http://localhost:18080';

export const run = async () => {
  const $xml = await fromURL(`${BASE}/feed.xml`);

  assert.strictEqual($xml('entry').length, 2);
  assert.strictEqual($xml('entry title').first().text(), 'first');

  let threw = false;
  try {
    await fromURL(`${BASE}/api/json`);
  } catch (err) {
    threw = true;
    const message = err instanceof Error ? err.message : String(err);
    assert.match(message, /neither HTML nor XML/i);
  }

  assert.ok(threw, 'Expected fromURL to reject unsupported content-type');

  return 'PASS: fromURL supports XML and rejects non-HTML/XML content';
};
