import assert from 'assert';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { html, raw } from 'hono/html';

export const run = async () => {
    const unsafe = '<script>alert("xss")</script>';
    const escaped = html`<p>${unsafe}</p>`.toString();

    assert.ok(escaped.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'));
    assert.ok(!escaped.includes('<script>alert("xss")</script>'));

    const trusted = html`<div>${raw('<strong>safe</strong>')}</div>`.toString();
    assert.ok(trusted.includes('<strong>safe</strong>'));

    const app = new Hono();
    app.use('/api/*', cors({ origin: 'https://example.com', credentials: true }));
    app.get('/api/data', (c) => c.json({ ok: true }));

    const response = await app.request('/api/data', {
        headers: {
            origin: 'https://example.com',
        },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.headers.get('access-control-allow-origin'), 'https://example.com');
    assert.strictEqual(response.headers.get('access-control-allow-credentials'), 'true');

    return 'PASS: HTML escaping and CORS middleware headers work';
};
