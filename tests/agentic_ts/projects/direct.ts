import kleur from 'kleur';

enum TaskState {
    Ready = 'ready',
}

export default {
    state: kleur.green(TaskState.Ready),
    answer: [20, 22].reduce((sum, value) => sum + value, 0),
};
