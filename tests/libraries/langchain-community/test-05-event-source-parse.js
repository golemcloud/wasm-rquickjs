import assert from 'assert';
import {
  getBytes,
  getLines,
  getMessages,
  convertEventStreamToIterableReadableDataStream,
} from '@langchain/community/utils/event_source_parse';

const encode = (value) => new TextEncoder().encode(value);

const createStream = (chunks) => new ReadableStream({
  start(controller) {
    for (const chunk of chunks) {
      controller.enqueue(encode(chunk));
    }
    controller.close();
  },
});

export const run = async () => {
  const parsed = [];
  const stream = createStream(['data: hello\n\n', 'event: update\ndata: world\n\n']);
  await getBytes(stream, getLines(getMessages((message) => parsed.push(message))));

  assert.strictEqual(parsed.length, 2);
  assert.strictEqual(parsed[0].data, 'hello');
  assert.strictEqual(parsed[1].event, 'update');
  assert.strictEqual(parsed[1].data, 'world');

  const iterable = convertEventStreamToIterableReadableDataStream(createStream(['data: one\n\n', 'data: two\n\n']));
  const items = [];
  for await (const item of iterable) {
    items.push(item);
  }

  assert.deepStrictEqual(items, ['one', 'two']);

  return 'PASS: event_source_parse utilities decode SSE chunks into message streams';
};
