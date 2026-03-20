import assert from 'assert';
import 'reflect-metadata';
import { Module, SetMetadata } from '@nestjs/common';
import { NestFactory } from '@nestjs/core/nest-factory';
import { Reflector } from '@nestjs/core/services/reflector.service';

const ROLE_KEY = 'custom:role';
const FlagDecorator = Reflector.createDecorator();

class DecoratedTarget {}
SetMetadata(ROLE_KEY, 'admin')(DecoratedTarget);
FlagDecorator({ enabled: true })(DecoratedTarget);

class AppModule {}
Module({})(AppModule);

export const run = async () => {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
    abortOnError: false,
    moduleIdGeneratorAlgorithm: 'reference'
  });

  try {
    const reflector = app.get(Reflector);
    assert.strictEqual(reflector.get(ROLE_KEY, DecoratedTarget), 'admin');
    assert.deepStrictEqual(reflector.get(FlagDecorator, DecoratedTarget), { enabled: true });
    return 'PASS: Reflector reads metadata from SetMetadata and createDecorator';
  } finally {
    await app.close();
  }
};
