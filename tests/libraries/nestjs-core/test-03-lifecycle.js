import assert from 'assert';
import 'reflect-metadata';
import { Injectable, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core/nest-factory';

const events = [];

class LifecycleService {
  onModuleInit() {
    events.push('onModuleInit');
  }

  onApplicationBootstrap() {
    events.push('onApplicationBootstrap');
  }

  onModuleDestroy() {
    events.push('onModuleDestroy');
  }

  onApplicationShutdown(signal) {
    events.push(`onApplicationShutdown:${signal ?? 'none'}`);
  }
}
Injectable()(LifecycleService);

class AppModule {}
Module({
  providers: [LifecycleService]
})(AppModule);

export const run = async () => {
  events.length = 0;
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
    abortOnError: false,
    moduleIdGeneratorAlgorithm: 'reference'
  });

  try {
    assert.ok(events.includes('onModuleInit'));
    assert.ok(events.includes('onApplicationBootstrap'));
  } finally {
    await app.close();
  }

  assert.ok(events.includes('onModuleDestroy'));
  assert.ok(events.some((event) => event.startsWith('onApplicationShutdown:')));
  return 'PASS: module/application lifecycle hooks run during init and close';
};
