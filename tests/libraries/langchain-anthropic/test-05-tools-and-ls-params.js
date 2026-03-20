import assert from 'assert';
import { ChatAnthropic, tools } from '@langchain/anthropic';

export const run = () => {
  const webSearch = tools.webSearch_20250305({
    maxUses: 3,
    allowedDomains: ['example.com'],
    deferLoading: true,
  });

  assert.strictEqual(webSearch.type, 'web_search_20250305');
  assert.strictEqual(webSearch.name, 'web_search');
  assert.strictEqual(webSearch.max_uses, 3);
  assert.deepStrictEqual(webSearch.allowed_domains, ['example.com']);
  assert.strictEqual(webSearch.defer_loading, true);

  const model = new ChatAnthropic({
    apiKey: 'test-key',
    model: 'claude-3-haiku-20240307',
    temperature: 0.6,
    maxTokens: 321,
  });

  const ls = model.getLsParams({ stop: ['HALT'] });
  assert.strictEqual(ls.ls_provider, 'anthropic');
  assert.strictEqual(ls.ls_model_name, 'claude-3-haiku-20240307');
  assert.strictEqual(ls.ls_model_type, 'chat');
  assert.strictEqual(ls.ls_temperature, 0.6);
  assert.strictEqual(ls.ls_max_tokens, 321);
  assert.deepStrictEqual(ls.ls_stop, ['HALT']);

  return 'PASS: tool factories and LangSmith parameter projection work as expected';
};
