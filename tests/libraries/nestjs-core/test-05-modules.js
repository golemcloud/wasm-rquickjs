import assert from 'assert';
import 'reflect-metadata';
import { Injectable, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core/nest-factory';

const SHARED_TEXT = 'SHARED_TEXT';
const CONSUMED_TEXT = 'CONSUMED_TEXT';

class SharedService {
  text() {
    return 'shared-value';
  }
}
Injectable()(SharedService);

class SharedModule {}
Module({
  providers: [
    SharedService,
    {
      provide: SHARED_TEXT,
      useFactory: (sharedService) => sharedService.text(),
      inject: [SharedService]
    }
  ],
  exports: [SHARED_TEXT]
})(SharedModule);

class AppModule {}
Module({
  imports: [SharedModule],
  providers: [
    {
      provide: CONSUMED_TEXT,
      useFactory: (sharedText) => `consumer:${sharedText}`,
      inject: [SHARED_TEXT]
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
    assert.strictEqual(app.get(CONSUMED_TEXT), 'consumer:shared-value');
    return 'PASS: imported module exports are available to consumer module providers';
  } finally {
    await app.close();
  }
};
