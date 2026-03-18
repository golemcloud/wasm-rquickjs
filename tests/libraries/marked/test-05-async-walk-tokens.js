import assert from 'assert';
import { Marked } from 'marked';

export const run = async () => {
  const instance = new Marked({ async: true });

  instance.use({
    async: true,
    walkTokens: async (token) => {
      if (token.type === 'text') {
        token.text = token.text.replace('world', 'WASM');
      }
    }
  });

  const html = await instance.parse('Hello world');
  assert.ok(html.includes('<p>Hello WASM</p>'));

  return 'PASS: Async walkTokens can transform token text before rendering';
};
