import assert from 'assert';
import { ElevenLabsClient, ElevenLabsError } from 'elevenlabs';

export const run = () => {
  const originalApiKey = process.env.ELEVENLABS_API_KEY;

  try {
    delete process.env.ELEVENLABS_API_KEY;

    let missingKeyError;
    try {
      new ElevenLabsClient();
    } catch (error) {
      missingKeyError = error;
    }

    assert.ok(missingKeyError instanceof ElevenLabsError, 'missing API key should throw ElevenLabsError');
    assert.match(
      missingKeyError.message,
      /ELEVENLABS_API_KEY/,
      'error message should mention ELEVENLABS_API_KEY env var'
    );

    process.env.ELEVENLABS_API_KEY = 'env-api-key';
    const clientFromEnv = new ElevenLabsClient();
    assert.ok(clientFromEnv.voices, 'client should initialize from ELEVENLABS_API_KEY env var');

    return 'PASS: API key resolution and missing-key error behavior are correct';
  } finally {
    if (originalApiKey === undefined) {
      delete process.env.ELEVENLABS_API_KEY;
    } else {
      process.env.ELEVENLABS_API_KEY = originalApiKey;
    }
  }
};
