import assert from 'assert';
import { parse, parseSigned, serialize, serializeSigned } from 'hono/utils/cookie';

export const run = async () => {
    const plainCookie = serialize('session', 'abc123', { path: '/', httpOnly: true });
    assert.ok(plainCookie.includes('session=abc123'));
    assert.ok(plainCookie.includes('Path=/'));
    assert.ok(plainCookie.includes('HttpOnly'));

    const parsed = parse('session=abc123; theme=dark');
    assert.deepStrictEqual(parsed, { session: 'abc123', theme: 'dark' });

    const secret = 'hono-cookie-secret';
    const signedCookie = await serializeSigned('token', 'user-7', secret, { path: '/' });
    const cookieHeader = signedCookie.split(';')[0];

    const verified = await parseSigned(cookieHeader, secret, 'token');
    assert.strictEqual(verified.token, 'user-7');

    const tamperedCookieHeader = `${cookieHeader}x`;
    const tampered = await parseSigned(tamperedCookieHeader, secret, 'token');
    assert.strictEqual(tampered.token, undefined);

    return 'PASS: cookie parse/serialize and signed cookie verification work';
};
