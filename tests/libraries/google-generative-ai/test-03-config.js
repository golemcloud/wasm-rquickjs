import assert from 'assert';
import {
  FunctionCallingMode,
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  SchemaType,
} from '@google/generative-ai';

export const run = () => {
  const client = new GoogleGenerativeAI('test-api-key');

  const model = client.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: 'You are concise and factual.',
    generationConfig: {
      temperature: 0.2,
      topP: 0.9,
      maxOutputTokens: 128,
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          answer: { type: SchemaType.STRING },
          confidence: { type: SchemaType.NUMBER },
        },
        required: ['answer'],
      },
    },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
    ],
    tools: [
      {
        functionDeclarations: [
          {
            name: 'get_weather',
            description: 'Get weather for a city',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                city: { type: SchemaType.STRING },
              },
              required: ['city'],
            },
          },
        ],
      },
    ],
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingMode.ANY,
        allowedFunctionNames: ['get_weather'],
      },
    },
  });

  assert.strictEqual(model.systemInstruction.role, 'system');
  assert.strictEqual(model.systemInstruction.parts[0].text, 'You are concise and factual.');
  assert.strictEqual(model.generationConfig.temperature, 0.2);
  assert.strictEqual(model.generationConfig.responseSchema.type, 'object');
  assert.strictEqual(model.safetySettings[0].category, HarmCategory.HARM_CATEGORY_HARASSMENT);
  assert.strictEqual(model.tools[0].functionDeclarations[0].name, 'get_weather');
  assert.strictEqual(model.toolConfig.functionCallingConfig.mode, FunctionCallingMode.ANY);

  return 'PASS: model options (generation, safety, tools, and system instruction) are preserved';
};
