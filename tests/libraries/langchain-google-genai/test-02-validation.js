import assert from 'assert';
import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export const run = () => {
  assert.throws(
    () =>
      new ChatGoogleGenerativeAI({
        apiKey: 'test-key',
        model: 'gemini-2.0-flash',
        temperature: 2.5,
      }),
    /temperature.*range/i
  );

  assert.throws(
    () =>
      new ChatGoogleGenerativeAI({
        apiKey: 'test-key',
        model: 'gemini-2.0-flash',
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      }),
    /duplicate|unique/i
  );

  return 'PASS: Constructor validation rejects invalid temperature and duplicate safety categories';
};
