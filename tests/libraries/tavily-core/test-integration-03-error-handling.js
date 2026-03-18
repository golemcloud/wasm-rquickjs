import assert from 'assert';
import { tavily } from '@tavily/core';

const client = tavily({
  apiKey: 'tvly-test-key',
  apiBaseURL: 'http://localhost:18080',
  clientSource: 'wasm-rquickjs-test-integration',
});

export const run = async () => {
  try {
    await client.search('trigger unauthorized', {
      topic: 'finance',
    });
    throw new Error('Expected search() to fail for unauthorized response');
  } catch (error) {
    assert.ok(error instanceof Error);
    assert.ok(
      error.message.includes('Mock unauthorized from Tavily API'),
      `Unexpected error message: ${error.message}`
    );
  }

  return 'PASS: Tavily SDK surfaces API error details';
};
