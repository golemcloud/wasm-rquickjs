import assert from 'assert';
import { load } from 'cheerio';

export const run = () => {
  const $ = load(`
    <section>
      <ul id="list"><li>one</li></ul>
      <form id="f">
        <input type="text" name="name" value="alice" />
        <input type="checkbox" name="active" value="yes" checked />
        <textarea name="note">hello</textarea>
      </form>
    </section>
  `);

  $('#list').append('<li>two</li>');
  $('#list li').first().after('<li>one-point-five</li>');
  $('#list li').last().addClass('tail');

  const values = $('#list li').map((_, el) => $(el).text()).get();
  assert.deepStrictEqual(values, ['one', 'one-point-five', 'two']);
  assert.strictEqual($('#list li.tail').text(), 'two');

  const serialized = $('#f').serialize();
  assert.strictEqual(serialized, 'name=alice&active=yes&note=hello');

  return 'PASS: manipulation and form serialization behave as expected';
};
