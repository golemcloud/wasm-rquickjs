import assert from 'node:assert';
import { Document, Settings, VectorStoreIndex } from 'llamaindex';
import { OpenAI, OpenAIEmbedding } from '@llamaindex/openai';

export const run = async () => {
  const apiKey = process.env.OPENAI_API_KEY;
  assert.ok(apiKey, 'OPENAI_API_KEY is required for live test');

  Settings.llm = new OpenAI({
    apiKey,
    model: 'gpt-4o-mini',
    temperature: 0,
    maxTokens: 16,
    maxRetries: 1,
  });
  Settings.embedModel = new OpenAIEmbedding({
    apiKey,
    model: 'text-embedding-3-small',
    maxRetries: 1,
  });

  const docs = [new Document({ text: 'The launch code is ORBIT-9.' })];
  const index = await VectorStoreIndex.fromDocuments(docs);
  const engine = index.asQueryEngine();
  const response = await engine.query({
    query: 'What is the launch code? Reply with the code only.',
  });

  const text = String(response).trim();
  assert.ok(text.length > 0, 'response should not be empty');
  assert.ok(text.includes('ORBIT-9'), `expected ORBIT-9 in response, got: ${text}`);

  return 'PASS: Live vector index retrieval works with OpenAI embedding + LLM';
};
