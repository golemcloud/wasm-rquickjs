import assert from 'assert';
import { AssemblyAI } from 'assemblyai';

export const run = () => {
  const client = new AssemblyAI({ apiKey: 'test-api-key' });

  assert.ok(client.files, 'files service should exist');
  assert.ok(client.transcripts, 'transcripts service should exist');
  assert.ok(client.lemur, 'lemur service should exist');
  assert.ok(client.realtime, 'realtime service should exist');
  assert.ok(client.streaming, 'streaming service should exist');

  return 'PASS: AssemblyAI client exposes core services';
};
