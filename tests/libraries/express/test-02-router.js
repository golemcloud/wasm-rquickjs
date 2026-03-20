import assert from 'node:assert';
import express from 'express';
import { dispatch } from './helpers.js';

export const run = async () => {
  const app = express();
  const router = express.Router();

  router.param('id', (req, _res, next, id) => {
    req.userId = Number(id);
    next();
  });

  router.get('/users/:id', (req, res) => {
    res.json({
      id: req.userId,
      sort: req.query.sort,
      path: req.path,
      baseUrl: req.baseUrl,
      originalUrl: req.originalUrl,
    });
  });

  app.use('/api', router);

  const result = await dispatch(app, {
    method: 'GET',
    url: '/api/users/42?sort=desc',
    headers: {
      host: 'example.test',
      accept: 'application/json',
    },
  });

  assert.strictEqual(result.statusCode, 200);
  const payload = JSON.parse(result.body);
  assert.deepStrictEqual(payload, {
    id: 42,
    sort: 'desc',
    path: '/users/42',
    baseUrl: '/api',
    originalUrl: '/api/users/42?sort=desc',
  });

  return 'PASS: express router params and query parsing work';
};
