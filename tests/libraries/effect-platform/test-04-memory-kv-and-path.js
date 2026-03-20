import assert from 'node:assert';
import { KeyValueStore, Path } from '@effect/platform';
import { Effect, Option, Schema } from 'effect';

export const run = async () => {
  const kvProgram = Effect.gen(function* () {
    const kv = yield* KeyValueStore.KeyValueStore;

    yield* kv.set('counter', '1');
    const current = yield* kv.get('counter');
    assert.strictEqual(
      Option.match(current, {
        onNone: () => '',
        onSome: (value) => value,
      }),
      '1'
    );

    const updated = yield* kv.modify('counter', (value) => String(Number(value) + 1));
    assert.strictEqual(
      Option.match(updated, {
        onNone: () => '',
        onSome: (value) => value,
      }),
      '2'
    );

    const schemaStore = kv.forSchema(
      Schema.Struct({
        id: Schema.Number,
        name: Schema.String,
      })
    );

    yield* schemaStore.set('user:1', { id: 1, name: 'Alice' });
    const user = yield* schemaStore.get('user:1');
    assert.strictEqual(
      Option.match(user, {
        onNone: () => '',
        onSome: (value) => value.name,
      }),
      'Alice'
    );
  });

  await Effect.runPromise(Effect.provide(kvProgram, KeyValueStore.layerMemory));

  const pathProgram = Effect.gen(function* () {
    const path = yield* Path.Path;
    assert.strictEqual(path.join('/tmp', 'effect', 'file.txt'), '/tmp/effect/file.txt');
    assert.strictEqual(path.basename('/tmp/effect/file.txt'), 'file.txt');
    assert.strictEqual(path.dirname('/tmp/effect/file.txt'), '/tmp/effect');
    assert.strictEqual(path.normalize('/tmp/a/../b'), '/tmp/b');

    const fileUrl = yield* path.toFileUrl('/tmp/effect/file.txt');
    const roundtrip = yield* path.fromFileUrl(fileUrl);
    assert.strictEqual(roundtrip, '/tmp/effect/file.txt');
  });

  await Effect.runPromise(Effect.provide(pathProgram, Path.layer));

  return 'PASS: KeyValueStore memory layer and Path layer work';
};
