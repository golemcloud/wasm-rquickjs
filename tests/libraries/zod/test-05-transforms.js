import assert from 'assert';
import { z } from 'zod';

export const run = () => {
    // Transform
    const toLength = z.string().transform(s => s.length);
    assert.strictEqual(toLength.parse("hello"), 5);
    assert.strictEqual(toLength.parse(""), 0);

    // Default values
    const WithDefault = z.string().default("fallback");
    assert.strictEqual(WithDefault.parse(undefined), "fallback");
    assert.strictEqual(WithDefault.parse("value"), "value");

    // Nullable
    const NullableString = z.string().nullable();
    assert.strictEqual(NullableString.parse(null), null);
    assert.strictEqual(NullableString.parse("hello"), "hello");
    assert.strictEqual(NullableString.safeParse(123).success, false);

    // Nullish (null | undefined)
    const NullishNum = z.number().nullish();
    assert.strictEqual(NullishNum.parse(null), null);
    assert.strictEqual(NullishNum.parse(undefined), undefined);
    assert.strictEqual(NullishNum.parse(42), 42);

    // Catch (provides fallback on parse failure)
    const Caught = z.number().catch(0);
    assert.strictEqual(Caught.parse(42), 42);
    assert.strictEqual(Caught.parse("invalid"), 0);

    // Refine (custom validation)
    const EvenNumber = z.number().refine(n => n % 2 === 0, { message: "Must be even" });
    assert.strictEqual(EvenNumber.parse(4), 4);
    const evenFail = EvenNumber.safeParse(3);
    assert.strictEqual(evenFail.success, false);
    assert.ok(evenFail.error.issues[0].message.includes("even"));

    // Coerce
    assert.strictEqual(z.coerce.number().parse("42"), 42);
    assert.strictEqual(z.coerce.string().parse(123), "123");
    assert.strictEqual(z.coerce.boolean().parse(1), true);
    assert.strictEqual(z.coerce.boolean().parse(0), false);

    // Number validation checks
    assert.strictEqual(z.number().int().safeParse(3.14).success, false);
    assert.strictEqual(z.number().int().safeParse(3).success, true);
    assert.strictEqual(z.number().positive().safeParse(-1).success, false);
    assert.strictEqual(z.number().positive().safeParse(1).success, true);
    assert.strictEqual(z.number().nonnegative().safeParse(0).success, true);
    assert.strictEqual(z.number().min(5).max(10).safeParse(7).success, true);
    assert.strictEqual(z.number().min(5).max(10).safeParse(3).success, false);

    return "PASS: transforms, defaults, nullable, catch, refine, coerce, number checks";
};
