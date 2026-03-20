import assert from 'assert';
import { Document } from '@langchain/core/documents';
import { HtmlToTextTransformer } from '@langchain/community/document_transformers/html_to_text';

export const run = async () => {
  const transformer = new HtmlToTextTransformer();
  const [result] = await transformer.transformDocuments([
    new Document({
      pageContent: '<h1>Hello</h1><p>Community <strong>test</strong> document.</p>',
      metadata: { source: 'unit-test' },
    }),
  ]);

  assert.ok(/hello/i.test(result.pageContent));
  assert.ok(result.pageContent.includes('Community test document.'));
  assert.ok(!result.pageContent.includes('<h1>'));
  assert.strictEqual(result.metadata.source, 'unit-test');

  return 'PASS: HtmlToTextTransformer converts markup while preserving metadata';
};
