import assert from 'assert';
import { plainToInstance, instanceToPlain, Transform, Expose } from 'class-transformer';

class Product {
  constructor() {
    this.sku = '';
    this.internalCost = 0;
    this.legacyCode = '';
  }
}

Transform(({ value }) => String(value).toUpperCase(), { toClassOnly: true })(Product.prototype, 'sku');
Transform(({ value }) => String(value).toLowerCase(), { toPlainOnly: true })(Product.prototype, 'sku');
Expose({ groups: ['internal'] })(Product.prototype, 'internalCost');
Expose({ since: 2 })(Product.prototype, 'legacyCode');

export const run = () => {
  const product = plainToInstance(
    Product,
    {
      sku: 'ab-12',
      internalCost: 99,
      legacyCode: 'legacy-only',
    },
    { version: 2, groups: ['internal'] },
  );

  assert.strictEqual(product.sku, 'AB-12');

  const publicV1 = instanceToPlain(product, { version: 1, groups: [] });
  assert.strictEqual(publicV1.sku, 'ab-12');
  assert.strictEqual('internalCost' in publicV1, false);
  assert.strictEqual('legacyCode' in publicV1, false);

  const internalV2 = instanceToPlain(product, { version: 2, groups: ['internal'] });
  assert.strictEqual(internalV2.sku, 'ab-12');
  assert.strictEqual(internalV2.internalCost, 99);
  assert.strictEqual(internalV2.legacyCode, 'legacy-only');

  return 'PASS: Transform direction, groups, and version filters work';
};
