import assert from 'assert';
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';

export const run = async () => {
  const loader = new CheerioWebBaseLoader('http://localhost:18080/page', {
    selector: '#content',
  });

  const docs = await loader.load();

  assert.strictEqual(docs.length, 1);
  assert.strictEqual(docs[0].metadata.title, 'Mock Community Page');
  assert.ok(docs[0].pageContent.includes('LangChain community loader content'));

  return 'PASS: CheerioWebBaseLoader fetches and parses mock HTML over HTTP';
};
