import assert from 'assert';
import 'reflect-metadata';
import { Injectable, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core/nest-factory';

class GreetingService {
  greet(name = 'world') {
    return `Hello, ${name}!`;
  }
}
Injectable()(GreetingService);

class AppModule {}
Module({
  providers: [GreetingService]
})(AppModule);

export const run = async () => {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
    abortOnError: false,
    moduleIdGeneratorAlgorithm: 'reference'
  });

  try {
    const greeting = app.get(GreetingService).greet('NestJS');
    assert.strictEqual(greeting, 'Hello, NestJS!');
    return 'PASS: createApplicationContext resolves a basic injectable service';
  } finally {
    await app.close();
  }
};
