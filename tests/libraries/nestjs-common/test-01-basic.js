import assert from 'assert';
import 'reflect-metadata';
import { Controller, Get, RequestMethod, SetMetadata } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';

class UsersController {
  list() {
    return ['ada', 'grace'];
  }
}

Controller('users')(UsersController);

const methodDescriptor = Object.getOwnPropertyDescriptor(UsersController.prototype, 'list');
Get('list')(UsersController.prototype, 'list', methodDescriptor);
SetMetadata('permission', 'read:users')(UsersController.prototype, 'list', methodDescriptor);

export const run = () => {
  assert.strictEqual(Reflect.getMetadata(PATH_METADATA, UsersController), 'users');
  assert.strictEqual(Reflect.getMetadata(PATH_METADATA, methodDescriptor.value), 'list');
  assert.strictEqual(Reflect.getMetadata(METHOD_METADATA, methodDescriptor.value), RequestMethod.GET);
  assert.strictEqual(Reflect.getMetadata('permission', methodDescriptor.value), 'read:users');

  return 'PASS: core controller and route decorators attach expected metadata';
};
