import assert from 'assert';
import { tavily } from '@tavily/core';

export const run = () => {
  const originalApiKey = process.env.TAVILY_API_KEY;
  const originalHttpProxy = process.env.TAVILY_HTTP_PROXY;
  const originalHttpsProxy = process.env.TAVILY_HTTPS_PROXY;
  const originalProject = process.env.TAVILY_PROJECT;

  process.env.TAVILY_API_KEY = 'tvly-env-key';
  process.env.TAVILY_HTTP_PROXY = 'http://proxy.local:8080';
  process.env.TAVILY_HTTPS_PROXY = 'http://proxy.local:8443';
  process.env.TAVILY_PROJECT = 'project-from-env';

  try {
    const client = tavily({
      apiBaseURL: 'http://localhost:18080',
      clientSource: 'wasm-rquickjs-test-env',
    });

    assert.strictEqual(typeof client.search, 'function');
    assert.strictEqual(typeof client.extract, 'function');
    assert.strictEqual(typeof client.map, 'function');
    assert.strictEqual(typeof client.research, 'function');

    return 'PASS: tavily client reads API key and optional settings from environment';
  } finally {
    if (originalApiKey === undefined) delete process.env.TAVILY_API_KEY;
    else process.env.TAVILY_API_KEY = originalApiKey;

    if (originalHttpProxy === undefined) delete process.env.TAVILY_HTTP_PROXY;
    else process.env.TAVILY_HTTP_PROXY = originalHttpProxy;

    if (originalHttpsProxy === undefined) delete process.env.TAVILY_HTTPS_PROXY;
    else process.env.TAVILY_HTTPS_PROXY = originalHttpsProxy;

    if (originalProject === undefined) delete process.env.TAVILY_PROJECT;
    else process.env.TAVILY_PROJECT = originalProject;
  }
};
