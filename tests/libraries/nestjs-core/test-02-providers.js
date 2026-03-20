import assert from 'assert';
import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core/nest-factory';

const CONFIG_TOKEN = 'CONFIG_TOKEN';
const MESSAGE_TOKEN = 'MESSAGE_TOKEN';

class AppModule {}
Module({
  providers: [
    {
      provide: CONFIG_TOKEN,
      useValue: { greeting: 'Welcome', target: 'NestJS Core' }
    },
    {
      provide: MESSAGE_TOKEN,
      useFactory: (config) => `${config.greeting} to ${config.target}`,
      inject: [CONFIG_TOKEN]
    }
  ]
})(AppModule);

export const run = async () => {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
    abortOnError: false,
    moduleIdGeneratorAlgorithm: 'reference'
  });

  try {
    assert.deepStrictEqual(app.get(CONFIG_TOKEN), {
      greeting: 'Welcome',
      target: 'NestJS Core'
    });
    assert.strictEqual(app.get(MESSAGE_TOKEN), 'Welcome to NestJS Core');
    return 'PASS: value and factory providers resolve correctly with token injection';
  } finally {
    await app.close();
  }
};
