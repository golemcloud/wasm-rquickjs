import assert from 'assert';
import { Client } from '@modelcontextprotocol/sdk/client';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Server } from '@modelcontextprotocol/sdk/server';

export const run = async () => {
  const server = new Server(
    { name: 'mcp-test-server', version: '1.0.0' },
    { capabilities: {} },
  );

  const client = new Client(
    { name: 'mcp-test-client', version: '1.0.0' },
    { capabilities: {} },
  );

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);

  await client.ping();

  const serverVersion = client.getServerVersion();
  assert.strictEqual(serverVersion?.name, 'mcp-test-server');
  assert.strictEqual(serverVersion?.version, '1.0.0');

  const serverCapabilities = client.getServerCapabilities();
  assert.deepStrictEqual(serverCapabilities, {});

  await client.close();

  return 'PASS: in-memory handshake and ping work via Client/Server';
};
