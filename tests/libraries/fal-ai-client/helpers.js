import { createFalClient, withMiddleware } from '@fal-ai/client';

export const MOCK_SERVER_BASE = 'http://localhost:18080';

const proxyToMockServer = async (request) => ({
  ...request,
  url: `${MOCK_SERVER_BASE}/proxy`,
  headers: {
    ...(request.headers ?? {}),
    'x-fal-target-url': request.url,
  },
});

export const createMockFalClient = () =>
  createFalClient({
    credentials: 'test-key:test-secret',
    requestMiddleware: withMiddleware(proxyToMockServer),
  });
