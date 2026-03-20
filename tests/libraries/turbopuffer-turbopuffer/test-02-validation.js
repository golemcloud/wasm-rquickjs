import assert from 'assert';
import Turbopuffer from '@turbopuffer/turbopuffer';

export const run = () => {
  const originalApiKey = process.env.TURBOPUFFER_API_KEY;

  delete process.env.TURBOPUFFER_API_KEY;

  try {
    assert.throws(
      () => new Turbopuffer({ baseURL: 'http://localhost:18080', region: null }),
      /TURBOPUFFER_API_KEY environment variable is missing or empty/,
    );

    assert.throws(
      () => new Turbopuffer({
        apiKey: 'tpuf_test_key',
        baseURL: 'http://localhost:18080',
        region: 'aws-us-east-1',
      }),
      /region is set, but would be ignored/,
    );

    assert.throws(
      () => new Turbopuffer({
        apiKey: 'tpuf_test_key',
        baseURL: 'https://{region}.turbopuffer.com',
        region: null,
      }),
      /region is required, but not set/,
    );
  } finally {
    if (originalApiKey === undefined) {
      delete process.env.TURBOPUFFER_API_KEY;
    } else {
      process.env.TURBOPUFFER_API_KEY = originalApiKey;
    }
  }

  return 'PASS: Constructor validation reports missing API key and invalid region/baseURL combinations';
};
