import assert from 'assert';
import { z } from 'zod';

export const run = () => {
    // String length constraints
    assert.strictEqual(z.string().min(3).safeParse("ab").success, false);
    assert.strictEqual(z.string().min(3).safeParse("abc").success, true);
    assert.strictEqual(z.string().max(5).safeParse("abcdef").success, false);
    assert.strictEqual(z.string().max(5).safeParse("abcde").success, true);
    assert.strictEqual(z.string().length(4).safeParse("abcd").success, true);
    assert.strictEqual(z.string().length(4).safeParse("abc").success, false);

    // String pattern validation
    assert.strictEqual(z.string().email().safeParse("test@example.com").success, true);
    assert.strictEqual(z.string().email().safeParse("not-an-email").success, false);
    assert.strictEqual(z.string().url().safeParse("https://example.com").success, true);
    assert.strictEqual(z.string().url().safeParse("not-a-url").success, false);
    assert.strictEqual(z.string().uuid().safeParse("550e8400-e29b-41d4-a716-446655440000").success, true);
    assert.strictEqual(z.string().uuid().safeParse("not-a-uuid").success, false);

    // String regex
    assert.strictEqual(z.string().regex(/^[a-z]+$/).safeParse("hello").success, true);
    assert.strictEqual(z.string().regex(/^[a-z]+$/).safeParse("Hello").success, false);

    // String transforms
    assert.strictEqual(z.string().trim().parse("  hello  "), "hello");
    assert.strictEqual(z.string().toLowerCase().parse("HELLO"), "hello");
    assert.strictEqual(z.string().toUpperCase().parse("hello"), "HELLO");

    // includes, startsWith, endsWith
    assert.strictEqual(z.string().includes("world").safeParse("hello world").success, true);
    assert.strictEqual(z.string().includes("world").safeParse("hello").success, false);
    assert.strictEqual(z.string().startsWith("http").safeParse("https://x.com").success, true);
    assert.strictEqual(z.string().endsWith(".com").safeParse("example.com").success, true);

    return "PASS: string validation with length, patterns, transforms, and checks";
};
