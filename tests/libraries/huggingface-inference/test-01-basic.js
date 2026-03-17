import assert from 'assert';
import {
  HfInference,
  INFERENCE_PROVIDERS,
  InferenceClient,
  PROVIDERS_OR_POLICIES,
} from '@huggingface/inference';

export const run = () => {
  const client = new InferenceClient('hf_test_token', {
    endpointUrl: 'https://example.com/v1/chat/completions',
    retry_on_error: false,
  });

  assert.ok(client instanceof InferenceClient);
  assert.strictEqual(client.accessToken, 'hf_test_token');
  assert.strictEqual(client.defaultOptions.endpointUrl, 'https://example.com/v1/chat/completions');
  assert.strictEqual(client.defaultOptions.retry_on_error, false);

  const endpointClient = client.endpoint('https://example.com/v1/alt-endpoint');
  assert.ok(endpointClient instanceof InferenceClient);
  assert.strictEqual(endpointClient.defaultOptions.endpointUrl, 'https://example.com/v1/alt-endpoint');
  assert.strictEqual(endpointClient.defaultOptions.retry_on_error, false);

  const legacy = new HfInference('hf_legacy');
  assert.ok(legacy instanceof InferenceClient);

  assert.ok(INFERENCE_PROVIDERS.includes('hf-inference'));
  assert.ok(PROVIDERS_OR_POLICIES.includes('auto'));
  assert.ok(typeof client.chatCompletion === 'function');
  assert.ok(typeof client.textToImage === 'function');

  return 'PASS: InferenceClient construction, endpoint cloning, and exported provider constants work';
};
