import assert from 'assert';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const run = async () => {
  const client = new GoogleGenerativeAI('test-api-key');
  const model = client.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      maxOutputTokens: 64,
      temperature: 0.1,
    },
  });

  const emptyChat = model.startChat();
  const emptyHistory = await emptyChat.getHistory();
  assert.deepStrictEqual(emptyHistory, []);

  const seededChat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: 'question' }] },
      { role: 'model', parts: [{ text: 'answer' }] },
    ],
  });
  const seededHistory = await seededChat.getHistory();
  assert.strictEqual(seededHistory.length, 2);

  assert.throws(
    () =>
      client.getGenerativeModelFromCachedContent(
        {
          name: 'cachedContents/test-cache',
          model: 'models/gemini-1.0-pro',
          contents: [{ role: 'user', parts: [{ text: 'cached' }] }],
        },
        { model: 'gemini-1.5-flash' },
      ),
    (error) => {
      assert.match(error.message, /Different value/);
      return true;
    },
  );

  return 'PASS: chat defaults and cached-content request validation behave correctly';
};
