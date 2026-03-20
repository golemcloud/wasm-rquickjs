import assert from 'assert';
import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { IsInt, IsString, Min } from 'class-validator';

class CreateUserDto {}
IsString()(CreateUserDto.prototype, 'name');
IsInt()(CreateUserDto.prototype, 'age');
Min(18)(CreateUserDto.prototype, 'age');

const metadata = { type: 'body', metatype: CreateUserDto, data: undefined };

export const run = async () => {
  const pipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true
  });

  const valid = await pipe.transform({ name: 'Ada', age: 37 }, metadata);
  assert.ok(valid instanceof CreateUserDto);
  assert.strictEqual(valid.name, 'Ada');
  assert.strictEqual(valid.age, 37);

  await assert.rejects(
    () => pipe.transform({ name: 'Ada', age: 15, extra: true }, metadata),
    (error) => {
      assert.ok(error instanceof BadRequestException);
      const response = error.getResponse();
      assert.strictEqual(response.error, 'Bad Request');
      assert.ok(Array.isArray(response.message));
      assert.ok(response.message.some((m) => m.includes('age must not be less than 18')));
      assert.ok(response.message.some((m) => m.includes('property extra should not exist')));
      return true;
    }
  );

  return 'PASS: ValidationPipe transforms DTOs and rejects invalid/extra properties';
};
