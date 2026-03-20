import assert from 'assert';
import { Marked } from 'marked';

export const run = () => {
  const instance = new Marked();

  instance.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return `<h${depth} data-slug="${slug}">${text}</h${depth}>\n`;
      }
    }
  });

  const html = instance.parse('## Custom Heading');
  assert.strictEqual(html.trim(), '<h2 data-slug="custom-heading">Custom Heading</h2>');

  return 'PASS: Custom renderer overrides default heading output';
};
