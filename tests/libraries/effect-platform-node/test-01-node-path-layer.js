import assert from 'node:assert';
import { Path } from '@effect/platform';
import { NodePath } from '@effect/platform-node';
import { Effect } from 'effect';

export const run = async () => {
  const program = Effect.gen(function* () {
    const path = yield* Path.Path;
    assert.strictEqual(path.join('/tmp', 'effect', 'file.txt'), '/tmp/effect/file.txt');
    assert.strictEqual(path.basename('/tmp/effect/file.txt'), 'file.txt');
    assert.strictEqual(path.dirname('/tmp/effect/file.txt'), '/tmp/effect');
    assert.strictEqual(path.normalize('/tmp/a/../b'), '/tmp/b');

    const fileUrl = yield* path.toFileUrl('/tmp/effect/file.txt');
    const roundtrip = yield* path.fromFileUrl(fileUrl);
    assert.strictEqual(roundtrip, '/tmp/effect/file.txt');
  }).pipe(Effect.provide(NodePath.layer));

  await Effect.runPromise(program);
  return 'PASS: NodePath layer resolves and transforms file paths';
};
