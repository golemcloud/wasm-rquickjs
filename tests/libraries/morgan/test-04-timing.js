import assert from 'assert';
import morgan from 'morgan';

const spinForMilliseconds = (milliseconds) => {
  const start = Date.now();
  while (Date.now() - start < milliseconds) {
    // intentional busy loop to produce measurable elapsed time
  }
};

export const run = () => {
  const req = {
    _startAt: process.hrtime(),
  };

  spinForMilliseconds(3);

  const res = {
    _startAt: process.hrtime(),
  };

  spinForMilliseconds(3);

  const responseTime = Number(morgan['response-time'](req, res, 3));
  const totalTime = Number(morgan['total-time'](req, res, 3));

  assert.ok(Number.isFinite(responseTime));
  assert.ok(responseTime >= 0);
  assert.ok(Number.isFinite(totalTime));
  assert.ok(totalTime >= responseTime);

  return 'PASS: response-time and total-time tokens produce numeric output';
};
