import assert from 'assert';
import { WikipediaQueryRun } from '@langchain/community/tools/wikipedia_query_run';

export const run = async () => {
  const tool = new WikipediaQueryRun({
    baseUrl: 'http://localhost:18080/wikipedia/api.php',
    topKResults: 2,
    maxDocContentLength: 500,
  });

  const response = await tool.invoke('golem cloud');

  assert.ok(response.includes('Page: Golem'));
  assert.ok(response.includes('Summary: Golem is a cloud for durable workers.'));

  return 'PASS: WikipediaQueryRun performs real HTTP search+page calls against mock server';
};
