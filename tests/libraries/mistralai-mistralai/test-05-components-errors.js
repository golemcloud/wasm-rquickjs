import assert from 'assert';
import {
  chatCompletionRequestToJSON,
  chatCompletionResponseFromJSON,
} from '@mistralai/mistralai/models/components/index.js';
import {
  ConnectionError,
  SDKValidationError,
} from '@mistralai/mistralai/models/errors/index.js';

export const run = () => {
  const requestJson = chatCompletionRequestToJSON({
    model: 'mistral-small-latest',
    messages: [{ role: 'user', content: 'hello' }],
    safePrompt: true,
  });

  const parsedRequest = JSON.parse(requestJson);
  assert.strictEqual(parsedRequest.model, 'mistral-small-latest');
  assert.strictEqual(parsedRequest.safe_prompt, true);
  assert.strictEqual(parsedRequest.stream, false);

  const invalidResult = chatCompletionResponseFromJSON(JSON.stringify({ id: 'only-id' }));
  assert.strictEqual(invalidResult.ok, false);
  assert.ok(invalidResult.error instanceof SDKValidationError);
  assert.ok(invalidResult.error.pretty().includes('ChatCompletionResponse'));

  const connectionError = new ConnectionError('connection failed', { cause: new Error('ECONNRESET') });
  assert.strictEqual(connectionError.name, 'ConnectionError');
  assert.ok(connectionError.cause instanceof Error);

  return 'PASS: component serializers and error classes behave as expected';
};
