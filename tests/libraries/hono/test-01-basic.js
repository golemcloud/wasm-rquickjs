import assert from 'assert';
import { Hono } from 'hono';

export const run = async () => {
    const app = new Hono();

    app.get('/users/:id/posts/:postId', (c) => {
        const params = c.req.param();
        return c.json({
            userId: params.id,
            postId: params.postId,
            fullPath: c.req.path,
        });
    });

    const response = await app.request('/users/42/posts/99');
    const body = await response.json();

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(body, {
        userId: '42',
        postId: '99',
        fullPath: '/users/42/posts/99',
    });

    return 'PASS: basic routing and path param extraction work';
};
