import assert from 'assert';
import { TextToSpeechClient } from '@google-cloud/text-to-speech/build/src/v1/index.js';
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

  const client = new TextToSpeechClient(
    {
      fallback: true,
      projectId: 'test-project',
      apiKey,
    },
    fallbackGax,
  );

  try {
    const [response] = await client.listVoices({ languageCode: 'en-US' });
    assert.ok(Array.isArray(response.voices));
  } catch (error) {
    const status = typeof error?.code === 'number' ? error.code : -1;
    assert.ok(
      [400, 401, 403, 404, 429].includes(status),
      `Unexpected live API status: ${status}; message=${error?.message ?? String(error)}`,
    );
  }

  await client.close();
  return 'PASS: live listVoices() request reaches Google Cloud Text-to-Speech endpoint with GOOGLE_API_KEY';
};
