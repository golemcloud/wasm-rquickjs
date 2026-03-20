import assert from 'assert';
import {
  InferenceClientInputError,
  getProviderHelper,
  makeRequestOptionsFromResolvedModel,
} from '@huggingface/inference';

export const run = () => {
  const hfTextGeneration = getProviderHelper('hf-inference', 'text-generation');
  const { url, info } = makeRequestOptionsFromResolvedModel(
    'meta-llama/Llama-3.3-70B-Instruct',
    hfTextGeneration,
    {
      accessToken: 'hf_demo_token',
      inputs: 'Say hello',
    },
    undefined,
    {
      task: 'text-generation',
      billTo: 'org-test',
    },
  );

  const headers = new Headers(info.headers);
  assert.strictEqual(url, 'https://router.huggingface.co/hf-inference/models/meta-llama/Llama-3.3-70B-Instruct');
  assert.strictEqual(info.method, 'POST');
  assert.strictEqual(headers.get('authorization'), 'Bearer hf_demo_token');
  assert.strictEqual(headers.get('content-type'), 'application/json');
  assert.strictEqual(headers.get('x-hf-bill-to'), 'org-test');
  assert.ok(headers.get('user-agent')?.includes('@huggingface/inference/'));
  assert.strictEqual(info.body, JSON.stringify({ inputs: 'Say hello' }));

  assert.throws(
    () => getProviderHelper('groq', 'text-to-image'),
    (error) => error instanceof InferenceClientInputError && error.message.includes("Task 'text-to-image' not supported"),
  );

  const openAiConversational = getProviderHelper('openai', 'conversational');
  assert.throws(
    () =>
      makeRequestOptionsFromResolvedModel(
        'openai/gpt-4o-mini',
        openAiConversational,
        {
          accessToken: 'hf_not_allowed',
          messages: [{ role: 'user', content: 'Hi' }],
        },
        undefined,
        { task: 'conversational' },
      ),
    (error) =>
      error instanceof InferenceClientInputError &&
      error.message.includes('closed-source and does not support HF tokens'),
  );

  return 'PASS: provider/task validation and request-option preparation behave as expected';
};
