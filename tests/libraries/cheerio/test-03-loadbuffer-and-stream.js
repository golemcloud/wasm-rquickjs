import assert from 'assert';
import { Buffer } from 'node:buffer';
import { loadBuffer, stringStream } from 'cheerio';

export const run = async () => {
  const fromBuffer = loadBuffer(Buffer.from('<article><p data-id="7">buffer</p></article>'));
  assert.strictEqual(fromBuffer('p').data('id'), 7);
  assert.strictEqual(fromBuffer('p').text(), 'buffer');

  const streamedText = await new Promise((resolve, reject) => {
    const writable = stringStream({}, (err, $) => {
      if (err) {
        reject(err);
        return;
      }
      resolve($('#value').text());
    });

    writable.write('<div><span id="value">stream-');
    writable.end('ok</span></div>');
  });

  assert.strictEqual(streamedText, 'stream-ok');

  return 'PASS: loadBuffer and stringStream parse content correctly';
};
