import assert from 'node:assert';
import { KeyValueStore } from '@effect/platform';
import { NodeKeyValueStore } from '@effect/platform-node';
import { Effect, Option } from 'effect';

const STORE_DIR = `./effect-platform-node-kv-${Date.now()}`;

export const run = async () => {
  const program = Effect.gen(function* () {
    const kv = yield* KeyValueStore.KeyValueStore;

    yield* kv.set('counter', '1');
    const firstRead = yield* kv.get('counter');
    assert.strictEqual(
      Option.match(firstRead, {
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

    yield* kv.remove('counter');
    const removed = yield* kv.get('counter');
    assert.strictEqual(
      Option.match(removed, {
        onNone: () => 'none',
        onSome: () => 'some',
      }),
      'none'
    );
  }).pipe(Effect.provide(NodeKeyValueStore.layerFileSystem(STORE_DIR)));

  await Effect.runPromise(program);
  return 'PASS: NodeKeyValueStore filesystem layer supports set/get/modify/remove';
};
