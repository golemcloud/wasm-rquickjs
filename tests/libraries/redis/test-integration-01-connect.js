import { createClient } from 'redis';

export const run = async () => {
    const client = createClient({ url: 'redis://localhost:63791' });
    await client.connect();

    // PING
    const pong = await client.ping();
    if (pong !== 'PONG') throw new Error(`Expected PONG, got ${pong}`);

    // SET / GET
    await client.set('test:connect:key1', 'hello');
    const val = await client.get('test:connect:key1');
    if (val !== 'hello') throw new Error(`Expected 'hello', got '${val}'`);

    // DEL
    const deleted = await client.del('test:connect:key1');
    if (deleted !== 1) throw new Error(`Expected 1 deleted, got ${deleted}`);

    // Confirm key is gone
    const gone = await client.get('test:connect:key1');
    if (gone !== null) throw new Error(`Expected null after DEL, got '${gone}'`);

    await client.disconnect();
    return 'PASS: connect, PING, SET/GET, DEL all work';
};
