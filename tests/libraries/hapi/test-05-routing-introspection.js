import assert from 'assert';
import Hapi from '@hapi/hapi';

const createServer = Hapi.server || Hapi.Server;

export const run = async () => {
    const server = createServer();

    server.route({
        method: 'GET',
        path: '/users/{id}',
        options: { id: 'users.by-id' },
        handler: (request) => ({ id: request.params.id }),
    });

    const lookupRoute = server.lookup('users.by-id');
    const matchedRoute = server.match('GET', '/users/123');
    const table = server.table();

    assert.strictEqual(lookupRoute.path, '/users/{id}');
    assert.strictEqual(matchedRoute.path, '/users/{id}');
    assert.ok(table.some((route) => route.path === '/users/{id}' && route.method === 'get'));

    return 'PASS: lookup, match, and table introspection work';
};
