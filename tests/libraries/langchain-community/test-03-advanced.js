import assert from 'assert';
import { CSVLoader } from '@langchain/community/document_loaders/fs/csv';

const csvText = 'name,role\nAlice,Engineer\nBob,Designer\n';

export const run = async () => {
  const blob = new Blob([csvText], { type: 'text/csv' });

  const loader = new CSVLoader(blob);
  const docs = await loader.load();
  assert.strictEqual(docs.length, 2);
  assert.ok(docs[0].pageContent.includes('name: Alice'));
  assert.ok(docs[0].pageContent.includes('role: Engineer'));

  const columnLoader = new CSVLoader(new Blob([csvText], { type: 'text/csv' }), 'name');
  const columnDocs = await columnLoader.load();
  assert.strictEqual(columnDocs.length, 2);
  assert.strictEqual(columnDocs[0].pageContent, 'Alice');
  assert.strictEqual(columnDocs[1].pageContent, 'Bob');

  return 'PASS: CSVLoader parses blob CSV content and column mode';
};
