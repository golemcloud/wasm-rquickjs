import assert from 'assert';
import { ScheduleModule } from '@nestjs/schedule';

const findOptionsProvider = (dynamicModule) => {
  const providers = dynamicModule.providers ?? [];
  return providers.find(
    (provider) => provider && typeof provider === 'object' && provider.provide === 'SCHEDULE_MODULE_OPTIONS'
  );
};

export const run = async () => {
  const syncModule = ScheduleModule.forRoot({ cronJobs: false });
  assert.strictEqual(syncModule.global, true);

  const syncOptionsProvider = findOptionsProvider(syncModule);
  assert.ok(syncOptionsProvider, 'SCHEDULE_MODULE_OPTIONS provider must exist for forRoot()');
  assert.deepStrictEqual(syncOptionsProvider.useValue, {
    cronJobs: false,
    intervals: true,
    timeouts: true,
  });

  const asyncModule = ScheduleModule.forRootAsync({
    useFactory: () => ({ intervals: false }),
  });

  const asyncOptionsProvider = findOptionsProvider(asyncModule);
  assert.ok(asyncOptionsProvider, 'SCHEDULE_MODULE_OPTIONS provider must exist for forRootAsync()');
  const resolvedAsyncOptions = await asyncOptionsProvider.useFactory();
  assert.deepStrictEqual(resolvedAsyncOptions, {
    cronJobs: true,
    intervals: false,
    timeouts: true,
  });

  return 'PASS: ScheduleModule forRoot/forRootAsync produce expected merged options';
};
