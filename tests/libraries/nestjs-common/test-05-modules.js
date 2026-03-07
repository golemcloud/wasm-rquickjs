import assert from 'assert';
import {
  ConfigurableModuleBuilder,
  Logger,
  applyDecorators,
  forwardRef,
  SetMetadata
} from '@nestjs/common';

const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN
} = new ConfigurableModuleBuilder().setClassMethodName('register').build();

class FeatureModule extends ConfigurableModuleClass {}

class DecoratedClass {}
applyDecorators(SetMetadata('feature', 'nestjs-common'), SetMetadata('kind', 'utility'))(DecoratedClass);

export const run = () => {
  const dynamicModule = FeatureModule.register({ enabled: true });
  assert.strictEqual(dynamicModule.module, FeatureModule);
  assert.ok(dynamicModule.providers.some((provider) => provider.provide === MODULE_OPTIONS_TOKEN));

  const ref = forwardRef(() => FeatureModule);
  assert.strictEqual(ref.forwardRef(), FeatureModule);

  assert.strictEqual(Reflect.getMetadata('feature', DecoratedClass), 'nestjs-common');
  assert.strictEqual(Reflect.getMetadata('kind', DecoratedClass), 'utility');

  const logger = new Logger('NestJsCommonTest');
  logger.log('logger smoke test');

  return 'PASS: module builder, forwardRef, applyDecorators, and Logger are usable standalone';
};
