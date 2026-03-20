import assert from 'assert';
import Hapi from '@hapi/hapi';

const createServer = Hapi.server || Hapi.Server;

export const run = async () => {
    const server = createServer();

    server.route({
        method: 'GET',
        path: '/hello/{name}',
        handler: (request) => ({ message: `Hello ${request.params.name}` }),
    });

    const response = await server.inject({ method: 'GET', url: '/hello/world' });

    assert.strictEqual(response.statusCode, 200);
    assert.deepStrictEqual(response.result, { message: 'Hello world' });

    return 'PASS: basic route registration and inject request work';
};
