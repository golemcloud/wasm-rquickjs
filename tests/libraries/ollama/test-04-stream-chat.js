import assert from 'assert';
import { Ollama } from 'ollama';

const makeNdjsonStream = (lines) => {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(`${line}\n`));
      }
      controller.close();
    },
  });
};

export const run = async () => {
  const lines = [
    JSON.stringify({
      model: 'tinyllm',
      message: { role: 'assistant', content: 'Hel' },
      done: false,
    }),
    JSON.stringify({
      model: 'tinyllm',
      message: { role: 'assistant', content: 'lo' },
      done: true,
      done_reason: 'stop',
    }),
  ];

  const mockFetch = async (url) => {
    assert.strictEqual(url, 'http://localhost:18080/api/chat');
    return new Response(makeNdjsonStream(lines), {
      status: 200,
      headers: { 'Content-Type': 'application/x-ndjson' },
    });
  };

  const client = new Ollama({ host: 'http://localhost:18080', fetch: mockFetch });
  const stream = await client.chat({
    model: 'tinyllm',
    messages: [{ role: 'user', content: 'Say hello' }],
    stream: true,
  });

  let combined = '';
  for await (const part of stream) {
    combined += part.message?.content ?? '';
  }

  assert.strictEqual(combined, 'Hello');
  return 'PASS: chat(..., stream=true) consumes NDJSON response chunks';
};
