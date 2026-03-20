import assert from 'assert';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const run = async () => {
  const client = new GoogleGenerativeAI('test-api-key');

  const shortModel = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
  assert.strictEqual(shortModel.model, 'models/gemini-1.5-flash');

  const fullModel = client.getGenerativeModel({ model: 'models/gemini-1.5-pro' });
  assert.strictEqual(fullModel.model, 'models/gemini-1.5-pro');

  const tunedModel = client.getGenerativeModel({ model: 'tunedModels/custom-model' });
  assert.strictEqual(tunedModel.model, 'tunedModels/custom-model');

  const chat = shortModel.startChat({
    history: [
      { role: 'user', parts: [{ text: 'hello' }] },
      { role: 'model', parts: [{ text: 'hi there' }] },
    ],
  });

  const history = await chat.getHistory();
  assert.strictEqual(history.length, 2);
  assert.strictEqual(history[0].role, 'user');
  assert.strictEqual(history[1].parts[0].text, 'hi there');

  return 'PASS: basic construction, model normalization, and chat history retrieval work';
};
