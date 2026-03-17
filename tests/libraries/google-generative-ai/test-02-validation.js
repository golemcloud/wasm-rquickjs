import assert from 'assert';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const run = () => {
  const client = new GoogleGenerativeAI('test-api-key');

  assert.throws(
    () => client.getGenerativeModel({}),
    (error) => {
      assert.match(error.message, /Must provide a model name/);
      return true;
    },
  );

  assert.throws(
    () =>
      client.getGenerativeModelFromCachedContent({
        model: 'models/gemini-1.5-pro',
        contents: [{ role: 'user', parts: [{ text: 'prompt' }] }],
      }),
    (error) => {
      assert.match(error.message, /name/);
      return true;
    },
  );

  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

  assert.throws(
    () =>
      model.startChat({
        history: [{ role: 'model', parts: [{ text: 'invalid first message' }] }],
      }),
    (error) => {
      assert.match(error.message, /First content should be with role 'user'/);
      return true;
    },
  );

  assert.throws(
    () =>
      model.startChat({
        history: [{ role: 'user', parts: [] }],
      }),
    (error) => {
      assert.match(error.message, /should have at least one part/);
      return true;
    },
  );

  return 'PASS: input validation and chat history validation errors are enforced';
};
