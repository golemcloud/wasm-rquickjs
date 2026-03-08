import assert from 'assert';
import mongoose from 'mongoose';

export const run = () => {
  const baseSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
    },
    {
      discriminatorKey: 'kind',
    },
  );

  const Animal = mongoose.model('MongooseLibAnimal', baseSchema);
  const Cat = Animal.discriminator(
    'MongooseLibCat',
    new mongoose.Schema({
      lives: { type: Number, default: 9 },
      traits: [{ type: String }],
    }),
  );

  const cat = new Cat({ name: 'Mimi', traits: ['playful'] });
  const err = cat.validateSync();

  assert.strictEqual(err, undefined);
  assert.strictEqual(cat.kind, 'MongooseLibCat');
  assert.strictEqual(cat.lives, 9);
  assert.deepStrictEqual(cat.toObject().traits, ['playful']);

  return 'PASS: discriminators and defaults work offline';
};
