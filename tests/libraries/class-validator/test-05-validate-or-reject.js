import assert from 'assert';
import { ArrayMinSize, IsArray, IsString, ValidateNested, validateOrReject } from 'class-validator';

class AddressInput {
  constructor(city) {
    this.city = city;
  }
}

IsString()(AddressInput.prototype, 'city');

class OrderInput {
  constructor(addresses) {
    this.addresses = addresses;
  }
}

IsArray()(OrderInput.prototype, 'addresses');
ArrayMinSize(1)(OrderInput.prototype, 'addresses');
ValidateNested({ each: true })(OrderInput.prototype, 'addresses');

export const run = async () => {
  try {
    await validateOrReject(new OrderInput([]), { forbidUnknownValues: false });
    throw new Error('Expected validateOrReject to reject for empty addresses');
  } catch (error) {
    assert.ok(Array.isArray(error));
    assert.strictEqual(error.length, 1);
    assert.strictEqual(error[0].property, 'addresses');
  }

  await validateOrReject(
    new OrderInput([new AddressInput('Budapest')]),
    { forbidUnknownValues: false },
  );

  return 'PASS: validateOrReject returns errors and resolves for valid input';
};
