import assert from 'assert';
import { Subject, BehaviorSubject, ReplaySubject, AsyncSubject } from 'rxjs';

export const run = () => {
  const subjectValues = [];
  const subject = new Subject();
  subject.subscribe((v) => subjectValues.push(v));
  subject.next('a');
  subject.next('b');
  subject.complete();
  assert.deepStrictEqual(subjectValues, ['a', 'b']);

  const behaviorA = [];
  const behaviorB = [];
  const behavior = new BehaviorSubject(1);
  behavior.subscribe((v) => behaviorA.push(v));
  behavior.next(2);
  behavior.next(3);
  behavior.subscribe((v) => behaviorB.push(v));
  assert.deepStrictEqual(behaviorA, [1, 2, 3]);
  assert.deepStrictEqual(behaviorB, [3]);

  const replayA = [];
  const replayB = [];
  const replay = new ReplaySubject(2);
  replay.next(10);
  replay.next(20);
  replay.next(30);
  replay.subscribe((v) => replayA.push(v));
  replay.next(40);
  replay.subscribe((v) => replayB.push(v));
  assert.deepStrictEqual(replayA, [20, 30, 40]);
  assert.deepStrictEqual(replayB, [30, 40]);

  const asyncValues = [];
  const asyncSubject = new AsyncSubject();
  asyncSubject.subscribe((v) => asyncValues.push(v));
  asyncSubject.next('first');
  asyncSubject.next('last');
  asyncSubject.complete();
  assert.deepStrictEqual(asyncValues, ['last']);

  return 'PASS: Subject variants multicast and replay correctly';
};
