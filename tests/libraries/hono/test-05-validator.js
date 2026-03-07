import assert from 'assert';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { secureHeaders } from 'hono/secure-headers';
import { validator } from 'hono/validator';

export const run = async () => {
    const app = new Hono();

    app.use('*', secureHeaders());

    app.get(
        '/search',
        validator('query', (value) => {
            const q = value.q;
            if (!q || typeof q !== 'string' || q.trim() === '') {
                throw new HTTPException(400, { message: 'Missing query param: q' });
            }
            return { q: q.trim() };
        }),
        (c) => {
            const { q } = c.req.valid('query');
            return c.json({ results: [`result for: ${q}`] });
        }
    );

    app.onError((err, c) => {
        if (err instanceof HTTPException) {
            return err.getResponse();
        }

        return c.text('Internal Error', 500);
    });

    const okResponse = await app.request('/search?q=hono');
    assert.strictEqual(okResponse.status, 200);
    assert.strictEqual(okResponse.headers.get('x-content-type-options'), 'nosniff');

    const okBody = await okResponse.json();
    assert.deepStrictEqual(okBody, { results: ['result for: hono'] });

    const badResponse = await app.request('/search');
    assert.strictEqual(badResponse.status, 400);
    assert.strictEqual(await badResponse.text(), 'Missing query param: q');

    return 'PASS: validator, HTTPException, and secure headers middleware work';
};
