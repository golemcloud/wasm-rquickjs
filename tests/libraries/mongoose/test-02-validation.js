import assert from 'assert';
import mongoose from 'mongoose';

export const run = () => {
  const accountSchema = new mongoose.Schema({
    username: { type: String, required: true, minlength: 3 },
    age: { type: Number, min: 18, max: 120 },
    email: { type: String, match: /@/ },
    role: { type: String, enum: ['user', 'admin'] },
  });

  const Account = mongoose.model('MongooseLibValidationAccount', accountSchema);
  const invalidAccount = new Account({
    username: 'ab',
    age: 14,
    email: 'no-at-symbol',
    role: 'superadmin',
  });

  const err = invalidAccount.validateSync();
  assert(err instanceof mongoose.Error.ValidationError);
  assert(err.errors.username);
  assert(err.errors.age);
  assert(err.errors.email);
  assert(err.errors.role);

  return 'PASS: sync validation reports expected schema errors';
};
