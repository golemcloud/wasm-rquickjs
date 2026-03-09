import assert from 'assert';
import { map, filter, scan, take, toArray, of } from 'rxjs';

export const run = async () => {
  const values = await of(1, 2, 3, 4, 5)
    .pipe(
      map((x) => x * 3),
      filter((x) => x % 2 === 0),
      scan((acc, x) => acc + x, 0),
      take(2),
      toArray(),
    )
    .toPromise();

  assert.deepStrictEqual(values, [6, 18]);

  return 'PASS: core transformation and filtering operators work';
};
