import assert from 'assert';
import { marked } from 'marked';

export const run = () => {
  const markdown = '| Name | Score |\n| --- | ---: |\n| Alice | 10 |\n| Bob | 8 |';
  const html = marked(markdown);

  assert.ok(html.includes('<table>'));
  assert.ok(html.includes('<thead>'));
  assert.ok(html.includes('<tbody>'));
  assert.ok(html.includes('<td align="right">10</td>'));

  return 'PASS: GFM table syntax renders expected table structure';
};
