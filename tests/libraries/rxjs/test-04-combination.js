import assert from 'assert';
import {
  of,
  firstValueFrom,
  combineLatest,
  zip,
  forkJoin,
  toArray,
  mergeMap,
  concatMap,
  switchMap,
} from 'rxjs';

export const run = async () => {
  const combined = await firstValueFrom(combineLatest([of(1), of('a')]));
  assert.deepStrictEqual(combined, [1, 'a']);

  const zipped = await firstValueFrom(zip(of(1, 2), of('x', 'y')).pipe(toArray()));
  assert.deepStrictEqual(zipped, [
    [1, 'x'],
    [2, 'y'],
  ]);

  const joined = await firstValueFrom(forkJoin([of('left'), of('right')]));
  assert.deepStrictEqual(joined, ['left', 'right']);

  const merged = await firstValueFrom(
    of(1, 2)
      .pipe(mergeMap((v) => of(v, v * 10)), toArray()),
  );
  assert.deepStrictEqual(merged, [1, 10, 2, 20]);

  const concatenated = await firstValueFrom(
    of(1, 2)
      .pipe(concatMap((v) => of(v, -v)), toArray()),
  );
  assert.deepStrictEqual(concatenated, [1, -1, 2, -2]);

  const switched = await firstValueFrom(
    of(1, 2, 3)
      .pipe(switchMap((v) => of(v * 2)), toArray()),
  );
  assert.deepStrictEqual(switched, [2, 4, 6]);

  return 'PASS: combination and higher-order operators work';
};
