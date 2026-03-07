import assert from 'assert';
import Hapi from '@hapi/hapi';

const createServer = Hapi.server || Hapi.Server;

export const run = async () => {
    const server = createServer();

    server.auth.scheme('token', () => ({
        authenticate(request, h) {
            if (request.headers.authorization !== 'Bearer good-token') {
                throw new Error('Unauthorized');
            }

            return h.authenticated({ credentials: { user: 'alice' } });
        },
    }));

    server.auth.strategy('default-token', 'token');
    server.auth.default('default-token');

    server.route({
        method: 'GET',
        path: '/secure',
        handler: (request) => ({ user: request.auth.credentials.user }),
    });

    const unauthorized = await server.inject({ method: 'GET', url: '/secure' });
    const authorized = await server.inject({
        method: 'GET',
        url: '/secure',
        headers: { authorization: 'Bearer good-token' },
    });

    assert.strictEqual(unauthorized.statusCode, 500);
    assert.strictEqual(authorized.statusCode, 200);
    assert.deepStrictEqual(authorized.result, { user: 'alice' });

    return 'PASS: auth strategy and protected route execution work';
};
