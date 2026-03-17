import assert from 'node:assert';
import { Document, Settings, VectorStoreIndex } from 'llamaindex';
import { OpenAI, OpenAIEmbedding } from '@llamaindex/openai';

const BASE_URL = 'http://localhost:18080/v1';

export const run = async () => {
  Settings.llm = new OpenAI({
    apiKey: 'test-key',
    baseURL: BASE_URL,
    model: 'gpt-4o-mini',
    maxRetries: 0,
  });
  Settings.embedModel = new OpenAIEmbedding({
    apiKey: 'test-key',
    baseURL: BASE_URL,
    model: 'text-embedding-3-small',
    maxRetries: 0,
  });

  const docs = [new Document({ text: 'Project Orion access phrase is ALPHA-123.' })];
  const index = await VectorStoreIndex.fromDocuments(docs);
  const engine = index.asQueryEngine();

  const response = await engine.query({
    query: 'What is the project Orion access phrase? Reply with phrase only.',
  });

  assert.ok(String(response).includes('ALPHA-123'));
  return 'PASS: VectorStoreIndex query path works against mock OpenAI endpoints';
};
