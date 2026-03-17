import assert from 'assert';
import { Agent } from '@mastra/core/agent';

export const run = async () => {
  const apiKey = process.env.OPENAI_API_KEY;
  assert.ok(apiKey, 'OPENAI_API_KEY is required for live mastra test');

  const marker = 'MASTRA_LIVE_OPENAI_OK';

  const agent = new Agent({
    id: 'mastra-live-openai-agent',
    name: 'Mastra Live OpenAI Agent',
    instructions: `Always answer with exactly ${marker}`,
    model: 'openai/gpt-4o-mini',
  });

  const result = await agent.generate(`Reply with exactly ${marker}`);
  const text = String(result.text || '').trim();

  assert.ok(text.includes(marker), `Unexpected model output: ${text}`);

  return 'PASS: live OpenAI generation works through mastra Agent model routing';
};
