import assert from 'assert';
import { object, ref, string } from 'yup';

export const run = () => {
  const schema = object({
    kind: string().required().oneOf(['business', 'personal']),
    vatId: string().when('kind', {
      is: 'business',
      then: (s) => s.required().matches(/^VAT-\d{4}$/),
      otherwise: (s) => s.strip(),
    }),
    password: string().required().min(8),
    confirmPassword: string().required().oneOf([ref('password')]),
  });

  const business = schema.validateSync({
    kind: 'business',
    vatId: 'VAT-1234',
    password: 'strong-pass',
    confirmPassword: 'strong-pass',
  });
  assert.strictEqual(business.vatId, 'VAT-1234');

  const personal = schema.validateSync({
    kind: 'personal',
    vatId: 'SHOULD-BE-REMOVED',
    password: 'strong-pass',
    confirmPassword: 'strong-pass',
  });
  assert.ok(!Object.hasOwn(personal, 'vatId'));

  let mismatchErr;
  try {
    schema.validateSync({
      kind: 'business',
      vatId: 'VAT-1234',
      password: 'strong-pass',
      confirmPassword: 'wrong-pass',
    });
  } catch (e) {
    mismatchErr = e;
  }
  assert.strictEqual(mismatchErr?.path, 'confirmPassword');

  return 'PASS: conditional fields and cross-field ref validation work';
};
