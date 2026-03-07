import assert from 'node:assert';
import express from 'express';
import { dispatch } from './helpers.js';

export const run = async () => {
  const app = express();

  app.get('/boom', () => {
    throw new Error('boom');
  });

  app.use((error, req, res, _next) => {
    res.status(500).json({
      message: error.message,
      method: req.method,
    });
  });

  const result = await dispatch(app, {
    method: 'GET',
    url: '/boom',
    headers: {
      host: 'example.test',
      accept: 'application/json',
    },
  });

  assert.strictEqual(result.statusCode, 500);
  assert.deepStrictEqual(JSON.parse(result.body), {
    message: 'boom',
    method: 'GET',
  });

  return 'PASS: express error middleware catches route exceptions';
};
