import assert from 'assert';
import { tavily } from '@tavily/core';

export const run = async () => {
  const client = tavily({
    apiKey: 'tvly-test-key',
    apiBaseURL: 'http://localhost:18080',
    clientSource: 'wasm-rquickjs-test-deprecated',
  });

  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => {
    warnings.push(args.join(' '));
  };

  try {
    const qna = await client.searchQNA('What is Tavily?', { timeout: 5 });
    assert.strictEqual(qna, 'Mock answer from searchQNA');

    const context = await client.searchContext('Context request', {
      maxTokens: 200,
      timeout: 5,
    });
    assert.ok(typeof context === 'string' && context.length > 0, 'Expected JSON string context');

    assert.ok(
      warnings.some((w) => w.includes('searchQNA() is deprecated')),
      'Expected searchQNA deprecation warning'
    );
    assert.ok(
      warnings.some((w) => w.includes('searchContext() is deprecated')),
      'Expected searchContext deprecation warning'
    );

    return 'PASS: deprecated Tavily APIs still function and emit deprecation warnings';
  } finally {
    console.warn = originalWarn;
  }
};
