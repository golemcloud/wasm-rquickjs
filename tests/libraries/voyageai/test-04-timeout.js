import assert from 'assert';
import { VoyageAIClient, VoyageAITimeoutError } from 'voyageai';

export const run = async () => {
  const client = new VoyageAIClient({
    apiKey: 'test-key',
    timeoutInSeconds: 1,
    fetch: async () => {
      throw new DOMException('The operation was aborted', 'AbortError');
    },
  });

  let threw = false;
  try {
    await client.embed({
      input: 'timeout me',
      model: 'voyage-3-large',
    });
  } catch (error) {
    threw = true;
    const message = String(error?.message || error).toLowerCase();
    const isTimeoutErrorClass = error instanceof VoyageAITimeoutError;
    assert.ok(isTimeoutErrorClass || message.includes('timeout') || message.includes('aborted'));
  }

  assert.ok(threw, 'timeout/abort case must throw');
  return 'PASS: timeout and abort errors are surfaced';
};
