import assert from 'assert';
import { plainToInstance, instanceToPlain, Exclude, Expose } from 'class-transformer';

class UserDto {
  constructor() {
    this.id = 0;
    this.email = '';
    this.password = '';
  }
}

Exclude()(UserDto);
Expose()(UserDto.prototype, 'id');
Expose()(UserDto.prototype, 'email');

export const run = () => {
  const dto = plainToInstance(
    UserDto,
    {
      id: 12,
      email: 'alice@example.com',
      password: 'secret',
      ignored: 'noise',
    },
    { excludeExtraneousValues: true },
  );

  assert.strictEqual(dto.id, 12);
  assert.strictEqual(dto.email, 'alice@example.com');
  assert.strictEqual('password' in dto, true);
  assert.strictEqual(dto.password, '');
  assert.strictEqual('ignored' in dto, false);

  const plain = instanceToPlain(dto);
  assert.deepStrictEqual(plain, { id: 12, email: 'alice@example.com' });

  return 'PASS: Expose/Exclude metadata and excludeExtraneousValues work';
};
