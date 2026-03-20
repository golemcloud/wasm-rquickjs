import assert from 'assert';
import mongoose from 'mongoose';

export const run = () => {
  const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    age: { type: Number, min: 0 },
  });

  userSchema.virtual('fullName').get(function getFullName() {
    return `${this.firstName} ${this.lastName}`;
  });

  const User = mongoose.model('MongooseLibBasicUser', userSchema);
  const user = new User({ firstName: 'Ada', lastName: 'Lovelace', age: '36' });

  assert.strictEqual(user.age, 36);
  assert.strictEqual(user.fullName, 'Ada Lovelace');
  assert.deepStrictEqual(user.toObject().firstName, 'Ada');

  return 'PASS: basic schema, model, casting, and virtuals work';
};
