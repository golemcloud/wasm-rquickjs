import assert from 'assert';
import 'reflect-metadata';
import { plainToInstance, instanceToInstance, serialize, deserialize, Type, Exclude } from 'class-transformer';

class Token {
  constructor() {
    this.value = '';
  }
}

class Session {
  constructor() {
    this.id = '';
    this.token = null;
    this.issuedAt = null;
    this.secret = '';
  }
}

Type(() => Token)(Session.prototype, 'token');
Type(() => Date)(Session.prototype, 'issuedAt');
Exclude()(Session.prototype, 'secret');

export const run = () => {
  const session = plainToInstance(Session, {
    id: 'session-1',
    token: { value: 'abc' },
    issuedAt: '2025-01-01T00:00:00.000Z',
    secret: 'top-secret',
  });

  const clone = instanceToInstance(session);
  assert.strictEqual(clone instanceof Session, true);
  assert.strictEqual(clone.token instanceof Token, true);
  assert.notStrictEqual(clone, session);
  assert.notStrictEqual(clone.token, session.token);

  clone.token.value = 'changed';
  assert.strictEqual(session.token.value, 'abc');

  const json = serialize(session);
  assert.strictEqual(json.includes('top-secret'), false);

  const restored = deserialize(Session, json);
  assert.strictEqual(restored instanceof Session, true);
  assert.strictEqual(restored.token instanceof Token, true);
  assert.strictEqual(restored.issuedAt instanceof Date, true);
  assert.strictEqual(restored.id, 'session-1');

  return 'PASS: instance cloning and serialize/deserialize behavior works';
};
