import assert from 'assert';
import { of, throwError, firstValueFrom, map, catchError, retry, finalize } from 'rxjs';

export const run = async () => {
  let attempts = 0;
  let finalized = false;

  const recovered = await firstValueFrom(
    of('x').pipe(
      map(() => {
        attempts += 1;
        if (attempts < 3) {
          throw new Error('retry-me');
        }
        return 'ok';
      }),
      retry(2),
      catchError(() => of('failed')),
      finalize(() => {
        finalized = true;
      }),
    ),
  );

  assert.strictEqual(recovered, 'ok');
  assert.strictEqual(attempts, 3);
  assert.strictEqual(finalized, true);

  const fallback = await firstValueFrom(
    throwError(() => new Error('boom')).pipe(
      catchError((err) => of(`handled:${err.message}`)),
    ),
  );

  assert.strictEqual(fallback, 'handled:boom');

  return 'PASS: retry, catchError, and finalize behave correctly';
};
