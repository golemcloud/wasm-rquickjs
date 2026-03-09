import assert from 'assert';
import { Client } from '@modelcontextprotocol/sdk/client';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Server } from '@modelcontextprotocol/sdk/server';
import {
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

export const run = async () => {
  const server = new Server(
    { name: 'resource-prompt-server', version: '1.0.0' },
    { capabilities: { resources: {}, prompts: {} } },
  );

  server.setRequestHandler(ListResourcesRequestSchema, () => ({
    resources: [
      {
        uri: 'memory://welcome',
        name: 'welcome',
        description: 'welcome text',
        mimeType: 'text/plain',
      },
    ],
  }));

  server.setRequestHandler(ReadResourceRequestSchema, ({ params }) => ({
    contents: [
      {
        uri: params.uri,
        mimeType: 'text/plain',
        text: 'Hello from MCP resource',
      },
    ],
  }));

  server.setRequestHandler(ListPromptsRequestSchema, () => ({
    prompts: [
      {
        name: 'welcome-user',
        description: 'Greets the current user',
        arguments: [
          {
            name: 'user',
            description: 'Name of the user',
            required: true,
          },
        ],
      },
    ],
  }));

  server.setRequestHandler(GetPromptRequestSchema, ({ params }) => {
    const user = String(params.arguments?.user ?? 'friend');
    return {
      description: 'welcome-user prompt',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Welcome ${user}`,
          },
        },
      ],
    };
  });

  const client = new Client({ name: 'resource-client', version: '1.0.0' }, { capabilities: {} });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  const resources = await client.listResources();
  assert.strictEqual(resources.resources.length, 1);
  assert.strictEqual(resources.resources[0].uri, 'memory://welcome');

  const resourceBody = await client.readResource({ uri: 'memory://welcome' });
  assert.strictEqual(resourceBody.contents[0].text, 'Hello from MCP resource');

  const prompts = await client.listPrompts();
  assert.strictEqual(prompts.prompts.length, 1);
  assert.strictEqual(prompts.prompts[0].name, 'welcome-user');

  const prompt = await client.getPrompt({
    name: 'welcome-user',
    arguments: { user: 'Ada' },
  });
  assert.strictEqual(prompt.messages.length, 1);
  assert.strictEqual(prompt.messages[0].content.text, 'Welcome Ada');

  await client.close();

  return 'PASS: list/read resources and list/get prompts succeed';
};
