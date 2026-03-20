import assert from 'assert';
import sinon from 'sinon';

export const run = () => {
  const clock = sinon.useFakeTimers({ now: 0 });

  try {
    let fired = false;

    setTimeout(() => {
      fired = true;
    }, 250);

    assert.strictEqual(fired, false);
    clock.tick(249);
    assert.strictEqual(fired, false);
    clock.tick(1);
    assert.strictEqual(fired, true);
    assert.strictEqual(Date.now(), 250);

    return 'PASS: fake timers control timeout execution and Date.now';
  } finally {
    clock.restore();
  }
};
