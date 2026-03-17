import assert from 'node:assert';
import { FunctionTool } from 'llamaindex';

export const run = async () => {
  const weatherTool = FunctionTool.from(
    ({ city }) => `Weather in ${city}: 22C`,
    {
      name: 'get_weather',
      description: 'Returns a deterministic weather response',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string' },
        },
        required: ['city'],
      },
    },
  );

  const value = await weatherTool.call({ city: 'Budapest' });
  assert.strictEqual(value, 'Weather in Budapest: 22C');
  assert.strictEqual(weatherTool.metadata.name, 'get_weather');

  const bound = weatherTool.bind({});
  const value2 = await bound.call({ city: 'Paris' });
  assert.strictEqual(value2, 'Weather in Paris: 22C');

  return 'PASS: FunctionTool schema metadata and call/bind behavior work';
};
