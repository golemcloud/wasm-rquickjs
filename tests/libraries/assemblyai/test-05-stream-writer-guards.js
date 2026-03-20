import assert from 'assert';
import { AssemblyAI } from 'assemblyai';

export const run = async () => {
  const client = new AssemblyAI({ apiKey: 'test-api-key' });

  const realtime = client.realtime.transcriber();
  const realtimeWriter = realtime.stream().getWriter();
  await assert.rejects(
    realtimeWriter.write(new Uint8Array([10, 11])),
    /Socket is not open for communication/,
  );
  await realtimeWriter.abort();

  const streaming = client.streaming.transcriber({
    sampleRate: 16000,
    speechModel: 'universal-streaming-english',
  });
  const streamingWriter = streaming.stream().getWriter();
  await assert.rejects(
    streamingWriter.write(new Uint8Array([12, 13])),
    /Socket is not open for communication/,
  );
  await streamingWriter.abort();

  return 'PASS: Writable stream helpers enforce connected sockets';
};
