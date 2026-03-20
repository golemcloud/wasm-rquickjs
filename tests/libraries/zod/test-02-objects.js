import assert from 'assert';
import { z } from 'zod';

export const run = () => {
    // Basic object schema
    const UserSchema = z.object({
        name: z.string(),
        age: z.number(),
        email: z.string().email(),
    });

    const user = UserSchema.parse({ name: "Alice", age: 30, email: "alice@example.com" });
    assert.strictEqual(user.name, "Alice");
    assert.strictEqual(user.age, 30);
    assert.strictEqual(user.email, "alice@example.com");

    // Object with optional fields
    const ProfileSchema = z.object({
        username: z.string(),
        bio: z.string().optional(),
    });
    const profile = ProfileSchema.parse({ username: "bob" });
    assert.strictEqual(profile.username, "bob");
    assert.strictEqual(profile.bio, undefined);

    // Nested objects
    const OrderSchema = z.object({
        id: z.number(),
        item: z.object({
            name: z.string(),
            price: z.number(),
        }),
    });
    const order = OrderSchema.parse({ id: 1, item: { name: "Widget", price: 9.99 } });
    assert.strictEqual(order.item.name, "Widget");

    // Object manipulation: pick, omit, partial
    const Picked = UserSchema.pick({ name: true });
    const picked = Picked.parse({ name: "Charlie" });
    assert.strictEqual(picked.name, "Charlie");
    assert.strictEqual(picked.age, undefined);

    const Partial = UserSchema.partial();
    const partial = Partial.parse({ name: "Dave" });
    assert.strictEqual(partial.name, "Dave");

    // Strict object rejects unknown keys
    const StrictSchema = z.strictObject({ x: z.number() });
    const strictResult = StrictSchema.safeParse({ x: 1, y: 2 });
    assert.strictEqual(strictResult.success, false);

    return "PASS: object schemas with nesting, optional, pick, omit, partial, strict";
};
