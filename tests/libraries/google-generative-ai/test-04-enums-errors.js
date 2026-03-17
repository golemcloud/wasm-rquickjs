import assert from 'assert';
import {
  BlockReason,
  FinishReason,
  FunctionCallingMode,
  GoogleGenerativeAIAbortError,
  GoogleGenerativeAIError,
  GoogleGenerativeAIFetchError,
  GoogleGenerativeAIRequestInputError,
  GoogleGenerativeAIResponseError,
  HarmBlockThreshold,
  HarmCategory,
  SchemaType,
  TaskType,
} from '@google/generative-ai';

export const run = () => {
  assert.strictEqual(HarmCategory.HARM_CATEGORY_HATE_SPEECH, 'HARM_CATEGORY_HATE_SPEECH');
  assert.strictEqual(HarmBlockThreshold.BLOCK_NONE, 'BLOCK_NONE');
  assert.strictEqual(FinishReason.STOP, 'STOP');
  assert.strictEqual(BlockReason.SAFETY, 'SAFETY');
  assert.strictEqual(SchemaType.OBJECT, 'object');
  assert.strictEqual(FunctionCallingMode.AUTO, 'AUTO');
  assert.strictEqual(TaskType.RETRIEVAL_QUERY, 'RETRIEVAL_QUERY');

  const baseError = new GoogleGenerativeAIError('base message');
  assert.ok(baseError instanceof Error);
  assert.ok(baseError.message.includes('[GoogleGenerativeAI Error]'));

  const fetchError = new GoogleGenerativeAIFetchError('fetch failed', 429, 'Too Many Requests');
  assert.ok(fetchError instanceof GoogleGenerativeAIError);
  assert.strictEqual(fetchError.status, 429);
  assert.strictEqual(fetchError.statusText, 'Too Many Requests');

  const inputError = new GoogleGenerativeAIRequestInputError('bad input');
  assert.ok(inputError instanceof GoogleGenerativeAIError);

  const response = {
    candidates: [
      {
        content: { role: 'model', parts: [{ text: 'hello' }] },
      },
    ],
  };
  const responseError = new GoogleGenerativeAIResponseError('response failed', response);
  assert.ok(responseError instanceof GoogleGenerativeAIError);
  assert.deepStrictEqual(responseError.response, response);

  const abortError = new GoogleGenerativeAIAbortError('aborted');
  assert.ok(abortError instanceof GoogleGenerativeAIError);

  return 'PASS: enums and error classes match expected values and inheritance';
};
