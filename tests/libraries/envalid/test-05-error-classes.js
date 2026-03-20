import assert from 'assert';
import { EnvError, EnvMissingError, cleanEnv, port, str } from 'envalid';

export const run = () => {
  let missingErr = null;
  try {
    cleanEnv({}, { REQUIRED_TOKEN: str() }, { reporter: null });
  } catch (err) {
    missingErr = err;
  }
  assert.ok(missingErr instanceof EnvMissingError);

  let invalidErr = null;
  try {
    cleanEnv({ REQUIRED_TOKEN: 'ok', SERVICE_PORT: '70000' }, {
      REQUIRED_TOKEN: str(),
      SERVICE_PORT: port(),
    }, { reporter: null });
  } catch (err) {
    invalidErr = err;
  }
  assert.ok(invalidErr instanceof EnvError);

  return 'PASS: reporter=null exposes EnvMissingError and EnvError instances';
};
