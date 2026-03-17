import assert from 'assert';
import { Calculator } from '@langchain/community/tools/calculator';

export const run = async () => {
  const calculator = new Calculator();

  assert.strictEqual(await calculator.invoke('2 + 2'), '4');
  assert.strictEqual(await calculator.invoke('(10 / 4) + 0.5'), '3');
  assert.strictEqual(await calculator.invoke('not-valid-expression'), "I don't know how to do that.");

  return 'PASS: Calculator evaluates expressions and handles invalid input';
};
