import assert from 'assert';
import { Label, TypeDBCredential } from 'typedb-driver';

export const run = async () => {
  const noTlsCredential = new TypeDBCredential('alice', 'secret');
  assert.strictEqual(noTlsCredential.username, 'alice');
  assert.strictEqual(noTlsCredential.password, 'secret');
  assert.strictEqual(noTlsCredential.tlsRootCAPath, undefined);

  const simpleLabel = Label.of('person');
  assert.strictEqual(simpleLabel.scope, null);
  assert.strictEqual(simpleLabel.name, 'person');
  assert.strictEqual(simpleLabel.scopedName, 'person');
  assert.strictEqual(simpleLabel.toString(), 'person');

  const scopedLabel = Label.scoped('employment', 'employee');
  assert.strictEqual(scopedLabel.scope, 'employment');
  assert.strictEqual(scopedLabel.name, 'employee');
  assert.strictEqual(scopedLabel.scopedName, 'employment:employee');
  assert.strictEqual(scopedLabel.toString(), 'employment:employee');
  assert.ok(scopedLabel.equals(Label.scoped('employment', 'employee')));
  assert.ok(!scopedLabel.equals(simpleLabel));

  return 'PASS: credentials and labels expose expected fields and equality semantics';
};
