import assert from 'assert';
import { load } from 'cheerio';

export const run = () => {
  const $ = load(`
    <main>
      <h1 class="title">Cheerio</h1>
      <ul class="items"><li>one</li><li>two</li></ul>
      <a class="docs" href="/docs">Read docs</a>
    </main>
  `);

  assert.strictEqual($('.title').text(), 'Cheerio');
  assert.strictEqual($('.items li').length, 2);
  assert.strictEqual($('.items li').eq(1).text(), 'two');
  assert.strictEqual($('a.docs').attr('href'), '/docs');

  return 'PASS: load parses HTML and selectors work';
};
