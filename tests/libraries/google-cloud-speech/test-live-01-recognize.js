import assert from 'assert';
import { SpeechClient } from '@google-cloud/speech/build/src/v2/index.js';
import { fallback as fallbackGax } from 'google-gax';

if (!fallbackGax.loggingUtils) {
  fallbackGax.loggingUtils = {
    log: () => ({ info: () => {}, warn: () => {}, error: () => {}, debug: () => {} }),
  };
}

export const run = async () => {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return 'FAIL: Missing GOOGLE_API_KEY environment variable';
  }

  const client = new SpeechClient(
    {
      fallback: true,
      projectId: 'test-project',
      apiKey,
    },
    fallbackGax,
  );

  try {
    const [response] = await client.recognize({
      recognizer: 'projects/test-project/locations/us-central1/recognizers/_',
      config: {
        autoDecodingConfig: {},
        languageCodes: ['en-US'],
        model: 'latest_short',
      },
      content: Buffer.from([1, 2, 3, 4]),
    });

    // If the API key is enabled and the request succeeds, the response should contain a results array.
    assert.ok(Array.isArray(response.results));
  } catch (error) {
    const status = typeof error?.code === 'number' ? error.code : -1;
    // We intentionally use a placeholder project/recognizer. These status codes indicate
    // the request reached Google and failed for auth/permission/resource reasons.
    assert.ok(
      [400, 401, 403, 404].includes(status),
      `Unexpected live API status: ${status}; message=${error?.message ?? String(error)}`,
    );
  }

  await client.close();
  return 'PASS: live recognize() request reaches Google Speech endpoint with GOOGLE_API_KEY';
};
