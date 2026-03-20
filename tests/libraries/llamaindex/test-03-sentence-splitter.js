import assert from 'node:assert';
import { Document, SentenceSplitter } from 'llamaindex';

export const run = () => {
  const splitter = new SentenceSplitter({ chunkSize: 90, chunkOverlap: 0 });

  const sentence = 'Mercury is closest to the Sun while Saturn has rings and Jupiter is a gas giant.';
  const text = Array.from({ length: 30 }, () => sentence).join(' ');

  const doc = new Document({ text, metadata: { source: 'planets' } });
  const nodes = splitter.getNodesFromDocuments([doc]);

  assert.ok(nodes.length >= 2, 'longer text should be chunked into multiple nodes');
  assert.strictEqual(nodes[0].sourceNode?.nodeId, doc.id_);
  assert.strictEqual(nodes[0].metadata.source, 'planets');

  assert.ok(nodes.some((node) => node.text.includes('Saturn has rings')));

  return 'PASS: SentenceSplitter creates metadata-preserving chunks';
};
