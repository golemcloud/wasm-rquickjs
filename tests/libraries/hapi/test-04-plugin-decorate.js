import assert from 'assert';
import Hapi from '@hapi/hapi';

const createServer = Hapi.server || Hapi.Server;

export const run = async () => {
    const server = createServer();

    const plugin = {
        name: 'example-plugin',
        version: '1.0.0',
        register(pluginServer) {
            pluginServer.decorate('toolkit', 'ok', function (value) {
                return this.response({ ok: true, value });
            });

            pluginServer.expose('enabled', true);

            pluginServer.route({
                method: 'GET',
                path: '/plugin-status',
                handler: (_request, h) => h.ok('ready'),
            });
        },
    };

    await server.register(plugin);

    const response = await server.inject({ method: 'GET', url: '/plugin-status' });

    assert.strictEqual(server.plugins['example-plugin'].enabled, true);
    assert.strictEqual(response.statusCode, 200);
    assert.deepStrictEqual(response.result, { ok: true, value: 'ready' });

    return 'PASS: plugin register, expose, and toolkit decoration work';
};
