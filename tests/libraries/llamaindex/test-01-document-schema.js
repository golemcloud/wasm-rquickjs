import assert from 'node:assert';
import { Document, TextNode } from 'llamaindex';

export const run = () => {
  const docA = new Document({ text: 'alpha', metadata: { source: 'unit' } });
  const docB = new Document({ text: 'alpha', metadata: { source: 'unit' } });
  const docC = new Document({ text: 'beta', metadata: { source: 'unit' } });

  assert.strictEqual(docA.hash, docB.hash, 'same text+metadata must produce same hash');
  assert.notStrictEqual(docA.hash, docC.hash, 'different text must produce different hash');

  const clone = docA.clone();
  clone.metadata.source = 'changed';
  assert.strictEqual(docA.metadata.source, 'unit', 'clone metadata must be independent');

  const node = new TextNode({ text: 'hello world', metadata: { tag: 'n1' } });
  assert.strictEqual(node.getContent().includes('hello world'), true);

  return 'PASS: Document/TextNode schema and hashing behave correctly';
};
