import assert from 'assert';
import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';

export const run = () => {
  const explicit = new HttpException({ reason: 'invalid payload' }, HttpStatus.UNPROCESSABLE_ENTITY);
  assert.strictEqual(explicit.getStatus(), HttpStatus.UNPROCESSABLE_ENTITY);
  assert.deepStrictEqual(explicit.getResponse(), { reason: 'invalid payload' });

  const badRequest = new BadRequestException('invalid input');
  assert.strictEqual(badRequest.getStatus(), HttpStatus.BAD_REQUEST);

  const response = badRequest.getResponse();
  assert.strictEqual(typeof response, 'object');
  assert.strictEqual(response.error, 'Bad Request');
  assert.strictEqual(response.statusCode, HttpStatus.BAD_REQUEST);
  assert.strictEqual(response.message, 'invalid input');

  const body = HttpException.createBody('boom', 'Bad Request', HttpStatus.BAD_REQUEST);
  assert.deepStrictEqual(body, {
    message: 'boom',
    error: 'Bad Request',
    statusCode: HttpStatus.BAD_REQUEST
  });

  return 'PASS: HttpException and built-in HTTP exceptions return consistent response bodies';
};
