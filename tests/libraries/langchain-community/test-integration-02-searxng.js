import assert from 'assert';
import { SearxngSearch } from '@langchain/community/tools/searxng_search';

export const run = async () => {
  const tool = new SearxngSearch({
    apiBase: 'http://localhost:18080/searxng',
    params: {
      format: 'json',
      numResults: 2,
    },
  });

  const response = await tool.invoke('langchain community');

  assert.ok(response.includes('LangChain Community Docs'));
  assert.ok(response.includes('https://docs.example/langchain-community'));

  return 'PASS: SearxngSearch performs real HTTP POST calls against mock server';
};
