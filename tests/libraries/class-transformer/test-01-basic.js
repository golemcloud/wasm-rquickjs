import assert from 'assert';
import { plainToInstance, instanceToPlain } from 'class-transformer';

class User {
  constructor() {
    this.id = 0;
    this.name = '';
  }

  greeting() {
    return `hello ${this.name}`;
  }
}

export const run = () => {
  const user = plainToInstance(User, { id: 7, name: 'Alice' });
  assert.strictEqual(user instanceof User, true);
  assert.strictEqual(user.greeting(), 'hello Alice');

  const plain = instanceToPlain(user);
  assert.deepStrictEqual(plain, { id: 7, name: 'Alice' });

  return 'PASS: plainToInstance and instanceToPlain basic roundtrip works';
};
