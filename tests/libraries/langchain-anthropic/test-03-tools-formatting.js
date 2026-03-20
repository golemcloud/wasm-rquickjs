import assert from 'assert';
import { ChatAnthropic, tools } from '@langchain/anthropic';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const run = () => {
  const model = new ChatAnthropic({
    apiKey: 'test-key',
    model: 'claude-3-haiku-20240307',
  });

  const weatherTool = tool(
    async () => 'ok',
    {
      name: 'get_weather',
      description: 'Get weather by city',
      schema: z.object({ city: z.string() }),
      extras: {
        cache_control: { type: 'ephemeral' },
        defer_loading: true,
      },
    }
  );

  const formatted = model.formatStructuredToolToAnthropic([weatherTool]);
  assert.ok(Array.isArray(formatted));
  assert.strictEqual(formatted.length, 1);
  assert.strictEqual(formatted[0].name, 'get_weather');
  assert.strictEqual(formatted[0].description, 'Get weather by city');
  assert.strictEqual(formatted[0].input_schema.type, 'object');
  assert.ok(formatted[0].input_schema.properties?.city);
  assert.strictEqual(formatted[0].defer_loading, true);
  assert.strictEqual(formatted[0].cache_control.type, 'ephemeral');

  const searchTool = tools.toolSearchRegex_20251119();
  const params = model.invocationParams({ tools: [searchTool] });
  assert.ok(Array.isArray(params.betas));
  assert.ok(params.betas.includes('advanced-tool-use-2025-11-20'));

  return 'PASS: tool formatting and automatic Anthropic beta headers are computed correctly';
};
