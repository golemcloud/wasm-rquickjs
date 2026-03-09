import assert from 'assert';
import morgan from 'morgan';

export const run = () => {
  const writes = [];
  const stream = {
    write: (line) => writes.push(line),
  };

  const logger = morgan(':method :url :status', {
    immediate: true,
    stream,
    skip: (req) => req.url === '/skip-me',
  });

  const res = {
    statusCode: 200,
    headersSent: false,
    getHeader: () => undefined,
  };

  let nextCalls = 0;

  logger({ method: 'GET', url: '/ok', headers: {} }, res, () => {
    nextCalls += 1;
  });

  logger({ method: 'GET', url: '/skip-me', headers: {} }, res, () => {
    nextCalls += 1;
  });

  assert.strictEqual(nextCalls, 2);
  assert.strictEqual(writes.length, 1);
  assert.strictEqual(writes[0].trim(), 'GET /ok -');

  return 'PASS: immediate middleware logs and skip() filtering work';
};
