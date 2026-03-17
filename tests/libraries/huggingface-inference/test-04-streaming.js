import assert from 'assert';
import { chatCompletionStream } from '@huggingface/inference';

export const run = async () => {
  const encoder = new TextEncoder();
  const calls = [];

  const ssePayload = [
    'data: {"id":"chunk-1","object":"chat.completion.chunk","created":1,"model":"meta-llama/Llama-3.3-70B-Instruct","choices":[{"index":0,"delta":{"content":"Hel"}}]}\n\n',
    'data: {"id":"chunk-1","object":"chat.completion.chunk","created":1,"model":"meta-llama/Llama-3.3-70B-Instruct","choices":[{"index":0,"delta":{"content":"lo"}}]}\n\n',
    'data: [DONE]\n\n',
  ].join('');

  const mockFetch = async (url, init) => {
    calls.push({ url: String(url), headers: new Headers(init.headers) });

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(ssePayload));
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: { 'content-type': 'text/event-stream' },
    });
  };

  let text = '';
  for await (const chunk of chatCompletionStream(
    {
      accessToken: 'hf_mock_token',
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      messages: [{ role: 'user', content: 'Stream hello' }],
    },
    { fetch: mockFetch },
  )) {
    text += chunk.choices?.[0]?.delta?.content ?? '';
  }

  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].url, 'https://router.huggingface.co/v1/chat/completions');
  assert.strictEqual(calls[0].headers.get('authorization'), 'Bearer hf_mock_token');
  assert.strictEqual(text, 'Hello');

  return 'PASS: chatCompletionStream consumes SSE chunks and yields merged text deltas';
};
