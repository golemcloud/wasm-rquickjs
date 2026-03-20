import assert from 'assert';
import { z } from 'zod';

export const run = () => {
    // Test primitive schemas
    assert.strictEqual(z.string().parse("hello"), "hello");
    assert.strictEqual(z.number().parse(42), 42);
    assert.strictEqual(z.boolean().parse(true), true);

    // Test safeParse success
    const result = z.string().safeParse("hello");
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data, "hello");

    // Test safeParse failure
    const fail = z.string().safeParse(123);
    assert.strictEqual(fail.success, false);
    assert.ok(fail.error);
    assert.ok(fail.error.issues.length > 0);

    // Test parse throws on invalid
    let threw = false;
    try {
        z.string().parse(123);
    } catch (e) {
        threw = true;
        assert.ok(e.issues);
    }
    assert.strictEqual(threw, true);

    return "PASS: basic primitive parsing and safeParse work correctly";
};
