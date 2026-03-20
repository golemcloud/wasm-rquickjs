import { createClient } from 'redis';

export const run = async () => {
    const client = createClient({ url: 'redis://localhost:63791' });
    await client.connect();

    // Clean up any leftover keys from previous runs
    await client.del('test:cmd:hash', 'test:cmd:list', 'test:cmd:counter');

    // HSET / HGETALL
    await client.hSet('test:cmd:hash', { name: 'Alice', age: '30', city: 'NYC' });
    const hash = await client.hGetAll('test:cmd:hash');
    if (hash.name !== 'Alice') throw new Error(`Expected name=Alice, got ${hash.name}`);
    if (hash.age !== '30') throw new Error(`Expected age=30, got ${hash.age}`);
    if (hash.city !== 'NYC') throw new Error(`Expected city=NYC, got ${hash.city}`);

    // LPUSH / LRANGE
    await client.lPush('test:cmd:list', ['c', 'b', 'a']);
    const list = await client.lRange('test:cmd:list', 0, -1);
    if (list.length !== 3) throw new Error(`Expected 3 items, got ${list.length}`);
    if (list[0] !== 'a') throw new Error(`Expected first='a', got '${list[0]}'`);
    if (list[2] !== 'c') throw new Error(`Expected last='c', got '${list[2]}'`);

    // INCR / DECR
    await client.set('test:cmd:counter', '10');
    const incr = await client.incr('test:cmd:counter');
    if (incr !== 11) throw new Error(`Expected 11 after INCR, got ${incr}`);
    const decr = await client.decr('test:cmd:counter');
    if (decr !== 10) throw new Error(`Expected 10 after DECR, got ${decr}`);

    // EXPIRE + TTL
    await client.expire('test:cmd:counter', 60);
    const ttl = await client.ttl('test:cmd:counter');
    if (ttl <= 0 || ttl > 60) throw new Error(`Expected TTL in (0,60], got ${ttl}`);

    // Cleanup
    await client.del('test:cmd:hash', 'test:cmd:list', 'test:cmd:counter');

    await client.disconnect();
    return 'PASS: HSET/HGETALL, LPUSH/LRANGE, INCR/DECR, EXPIRE/TTL all work';
};
