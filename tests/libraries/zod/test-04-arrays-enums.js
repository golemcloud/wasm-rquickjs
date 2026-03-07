import assert from 'assert';
import { z } from 'zod';

export const run = () => {
    // Array schema
    const StringArray = z.array(z.string());
    const arr = StringArray.parse(["a", "b", "c"]);
    assert.deepStrictEqual(arr, ["a", "b", "c"]);
    assert.strictEqual(StringArray.safeParse([1, 2]).success, false);

    // Array with min/max
    assert.strictEqual(z.array(z.number()).min(2).safeParse([1]).success, false);
    assert.strictEqual(z.array(z.number()).min(2).safeParse([1, 2]).success, true);
    assert.strictEqual(z.array(z.number()).max(2).safeParse([1, 2, 3]).success, false);
    assert.strictEqual(z.array(z.number()).nonempty().safeParse([]).success, false);

    // Tuple
    const TupleSchema = z.tuple([z.string(), z.number()]);
    const tuple = TupleSchema.parse(["hello", 42]);
    assert.strictEqual(tuple[0], "hello");
    assert.strictEqual(tuple[1], 42);
    assert.strictEqual(TupleSchema.safeParse(["hello", "world"]).success, false);

    // Enum
    const ColorEnum = z.enum(["red", "green", "blue"]);
    assert.strictEqual(ColorEnum.parse("red"), "red");
    assert.strictEqual(ColorEnum.safeParse("yellow").success, false);

    // Record
    const RecordSchema = z.record(z.string(), z.number());
    const rec = RecordSchema.parse({ a: 1, b: 2 });
    assert.deepStrictEqual(rec, { a: 1, b: 2 });
    assert.strictEqual(RecordSchema.safeParse({ a: "str" }).success, false);

    // Literal
    assert.strictEqual(z.literal("hello").parse("hello"), "hello");
    assert.strictEqual(z.literal(42).parse(42), 42);
    assert.strictEqual(z.literal("hello").safeParse("world").success, false);

    // Union
    const UnionSchema = z.union([z.string(), z.number()]);
    assert.strictEqual(UnionSchema.parse("hello"), "hello");
    assert.strictEqual(UnionSchema.parse(42), 42);
    assert.strictEqual(UnionSchema.safeParse(true).success, false);

    return "PASS: arrays, tuples, enums, records, literals, and unions work correctly";
};
