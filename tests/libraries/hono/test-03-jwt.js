import assert from 'assert';
import { Jwt } from 'hono/utils/jwt';

export const run = async () => {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        sub: 'user-1',
        role: 'admin',
        iat: now,
        exp: now + 3600,
    };

    const secret = 'hono-jwt-secret';
    const token = await Jwt.sign(payload, secret, 'HS256');

    assert.strictEqual(token.split('.').length, 3);

    const verified = await Jwt.verify(token, secret, 'HS256');
    assert.strictEqual(verified.sub, payload.sub);
    assert.strictEqual(verified.role, payload.role);

    const decoded = Jwt.decode(token);
    assert.strictEqual(decoded.header.alg, 'HS256');
    assert.strictEqual(decoded.payload.sub, payload.sub);

    let verifyFailed = false;
    try {
        await Jwt.verify(`${token}tampered`, secret, 'HS256');
    } catch {
        verifyFailed = true;
    }

    assert.strictEqual(verifyFailed, true);

    return 'PASS: JWT sign/verify/decode and tamper rejection work';
};
