import assert from 'node:assert';
import { firstValueFrom, of } from 'rxjs';
import { map, reduce } from 'rxjs/operators';

export const run = async () => {
  const result = await firstValueFrom(
    of(1, 2, 3).pipe(
      map((value) => value * 2),
      reduce((sum, value) => sum + value, 0),
    ),
  );
  assert.strictEqual(result, 12);
  return 'PASS: rxjs package exports and operator subpaths execute from node_modules';
};
