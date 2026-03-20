import assert from 'assert';
import {
  VirtualTimeScheduler,
  interval,
  timer,
  debounceTime,
  take,
  toArray,
  merge,
  of,
  observeOn,
} from 'rxjs';

export const run = async () => {
  const scheduler = new VirtualTimeScheduler();

  const sourceA = interval(10, scheduler).pipe(take(3));
  const sourceB = timer(15, undefined, scheduler).pipe(take(1));

  const merged$ = merge(sourceA, sourceB).pipe(
    observeOn(scheduler),
    debounceTime(5, scheduler),
    toArray(),
  );

  const valuesPromise = merged$.toPromise();
  scheduler.flush();
  const values = await valuesPromise;

  // sourceA emits 0@10,1@20,2@30 and sourceB emits 0@15.
  // debounce(5) keeps each because gaps are >=5 frames.
  assert.deepStrictEqual(values, [0, 0, 1, 2]);

  const queueValues = await of(1, 2, 3).pipe(toArray()).toPromise();
  assert.deepStrictEqual(queueValues, [1, 2, 3]);

  return 'PASS: virtual-time scheduling works for time-based operators';
};
