import kleur from 'kleur';
import { buildResult } from '../../core/src/index.js';

enum Mode {
    Agent = 'agent',
}

const result = buildResult(kleur.green(Mode.Agent));

export default {
    ...result,
    total: result.values.reduce((sum, value) => sum + value, 0),
};
