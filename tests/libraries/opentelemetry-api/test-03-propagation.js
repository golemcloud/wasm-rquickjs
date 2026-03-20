import assert from 'assert';
import {
  ROOT_CONTEXT,
  baggageEntryMetadataFromString,
  defaultTextMapGetter,
  defaultTextMapSetter,
  propagation,
} from '@opentelemetry/api';

export const run = () => {
  const initialBaggage = propagation.createBaggage({
    'user.id': { value: 'u-123' },
    'tenant.id': {
      value: 't-456',
      metadata: baggageEntryMetadataFromString('source=test-suite'),
    },
  });

  assert.strictEqual(initialBaggage.getEntry('user.id').value, 'u-123');
  assert.strictEqual(initialBaggage.getEntry('tenant.id').value, 't-456');

  const extendedBaggage = initialBaggage.setEntry('request.id', { value: 'r-789' });
  assert.strictEqual(initialBaggage.getEntry('request.id'), undefined);
  assert.strictEqual(extendedBaggage.getEntry('request.id').value, 'r-789');

  const contextWithBaggage = propagation.setBaggage(ROOT_CONTEXT, extendedBaggage);
  assert.strictEqual(propagation.getBaggage(contextWithBaggage).getEntry('user.id').value, 'u-123');

  const contextWithoutBaggage = propagation.deleteBaggage(contextWithBaggage);
  assert.strictEqual(propagation.getBaggage(contextWithoutBaggage), undefined);

  const carrier = {};
  defaultTextMapSetter.set(carrier, 'x-custom-header', 'custom-value');
  assert.strictEqual(defaultTextMapGetter.get(carrier, 'x-custom-header'), 'custom-value');
  assert.deepStrictEqual(defaultTextMapGetter.keys(carrier), ['x-custom-header']);

  return 'PASS: propagation API supports baggage and text map helper operations';
};
