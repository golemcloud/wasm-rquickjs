import assert from 'assert';
import { tavily } from '@tavily/core';

export const run = () => {
  const originalApiKey = process.env.TAVILY_API_KEY;
  delete process.env.TAVILY_API_KEY;

  try {
    assert.throws(
      () => tavily(),
      /No API key provided|TAVILY_API_KEY/,
      'Expected tavily() to throw when no API key is provided'
    );

    const client = tavily({
      apiKey: 'tvly-test-key',
      apiBaseURL: 'http://localhost:18080',
      clientSource: 'wasm-rquickjs-test',
    });

    for (const method of [
      'search',
      'extract',
      'searchQNA',
      'searchContext',
      'crawl',
      'map',
      'research',
      'getResearch',
    ]) {
      assert.strictEqual(typeof client[method], 'function', `Expected ${method} to be a function`);
    }

    return 'PASS: tavily client validates API key and exposes expected methods';
  } finally {
    if (originalApiKey === undefined) {
      delete process.env.TAVILY_API_KEY;
    } else {
      process.env.TAVILY_API_KEY = originalApiKey;
    }
  }
};
