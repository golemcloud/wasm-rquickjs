import assert from 'assert';
import { Client } from '@modelcontextprotocol/sdk/client';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Server } from '@modelcontextprotocol/sdk/server';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

export const run = async () => {
  const server = new Server(
    { name: 'tool-server', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: [
      {
        name: 'sum',
        description: 'Adds two numbers',
        inputSchema: {
          type: 'object',
          properties: {
            a: { type: 'number' },
            b: { type: 'number' },
          },
          required: ['a', 'b'],
          additionalProperties: false,
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, ({ params }) => {
    if (params.name !== 'sum') {
      return {
        isError: true,
        content: [{ type: 'text', text: `Unknown tool: ${params.name}` }],
      };
    }

    const a = Number(params.arguments?.a ?? 0);
    const b = Number(params.arguments?.b ?? 0);
    return {
      content: [{ type: 'text', text: String(a + b) }],
    };
  });

  const client = new Client({ name: 'tool-client', version: '1.0.0' }, { capabilities: {} });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  const list = await client.listTools();
  assert.strictEqual(list.tools.length, 1);
  assert.strictEqual(list.tools[0].name, 'sum');

  const success = await client.callTool({
    name: 'sum',
    arguments: { a: 4, b: 9 },
  });
  assert.strictEqual(success.isError, undefined);
  assert.strictEqual(success.content[0].text, '13');

  const failure = await client.callTool({
    name: 'missing-tool',
    arguments: {},
  });
  assert.strictEqual(failure.isError, true);
  assert.ok(failure.content[0].text.includes('Unknown tool'));

  await client.close();

  return 'PASS: listTools and callTool work over in-memory transport';
};
