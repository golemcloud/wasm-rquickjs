import assert from 'assert';
import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({
  apiKey: 'test-api-key',
  baseUrl: 'http://127.0.0.1:18080',
  streamingBaseUrl: 'http://127.0.0.1:18080',
});

export const run = async () => {
  const completed = await client.transcripts.transcribe(
    { audio_url: 'https://cdn.mock.local/uploaded-4.wav' },
    { pollingInterval: 10, pollingTimeout: 5000 },
  );

  assert.strictEqual(completed.status, 'completed');
  assert.strictEqual(completed.id, 'tr_mock_1');
  assert.match(completed.text, /hello from mock transcript/);

  const sentences = await client.transcripts.sentences('tr_mock_1');
  assert.strictEqual(sentences.sentences[0].text, 'hello from mock transcript');

  const paragraphs = await client.transcripts.paragraphs('tr_mock_1');
  assert.strictEqual(paragraphs.paragraphs[0].text, 'hello from mock transcript');

  const wordSearch = await client.transcripts.wordSearch('tr_mock_1', ['hello']);
  assert.strictEqual(wordSearch.word_search_results[0].count, 1);

  const srt = await client.transcripts.subtitles('tr_mock_1', 'srt');
  assert.match(srt, /hello from mock transcript/);

  return 'PASS: transcript polling and read APIs work against mock HTTP API';
};
