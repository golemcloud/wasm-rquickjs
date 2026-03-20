import assert from 'assert';
import { TaskType } from '@google/generative-ai';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

export const run = () => {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: 'test-key',
    model: 'embedding-001',
    taskType: TaskType.RETRIEVAL_DOCUMENT,
    title: 'Unit Test Document',
  });

  assert.strictEqual(typeof embeddings.embedQuery, 'function');
  assert.strictEqual(typeof embeddings.embedDocuments, 'function');

  assert.throws(
    () =>
      new GoogleGenerativeAIEmbeddings({
        apiKey: 'test-key',
        model: 'embedding-001',
        taskType: TaskType.RETRIEVAL_QUERY,
        title: 'Should fail',
      }),
    /title can only/i
  );

  return 'PASS: embeddings constructor accepts valid retrieval-document config and rejects invalid title usage';
};
