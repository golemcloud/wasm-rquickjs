import assert from 'assert';
import Hapi from '@hapi/hapi';

const createServer = Hapi.server || Hapi.Server;

export const run = async () => {
    const server = createServer();
    let computeCount = 0;

    server.method('square', async (value) => {
        computeCount += 1;
        return value * value;
    }, {
        cache: {
            expiresIn: 60_000,
            generateTimeout: 1_000,
        },
    });

    await server.initialize();

    const first = await server.methods.square(9);
    const second = await server.methods.square(9);

    assert.strictEqual(first, 81);
    assert.strictEqual(second, 81);
    assert.strictEqual(computeCount, 1);

    await server.stop();

    return 'PASS: server.method caching and memoization work';
};
