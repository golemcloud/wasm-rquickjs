import assert from 'node:assert';
import { FileSystem, Path } from '@effect/platform';
import { NodeContext } from '@effect/platform-node';
import { Effect } from 'effect';

export const run = async () => {
  const baseDir = `./effect-platform-node-fs-${Date.now()}`;

  const program = Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    yield* fs.makeDirectory(baseDir, { recursive: true });

    const originalPath = path.join(baseDir, 'payload.txt');
    const renamedPath = path.join(baseDir, 'payload-renamed.txt');

    yield* fs.writeFileString(originalPath, 'hello-from-effect-platform-node');
    const originalContent = yield* fs.readFileString(originalPath);
    assert.strictEqual(originalContent, 'hello-from-effect-platform-node');

    yield* fs.rename(originalPath, renamedPath);
    const renamedContent = yield* fs.readFileString(renamedPath);
    assert.strictEqual(renamedContent, 'hello-from-effect-platform-node');

    const exists = yield* fs.exists(renamedPath);
    assert.strictEqual(exists, true);

    yield* fs.remove(baseDir, { recursive: true });
  }).pipe(Effect.provide(NodeContext.layer));

  await Effect.runPromise(program);
  return 'PASS: NodeFileSystem directory IO works';
};
