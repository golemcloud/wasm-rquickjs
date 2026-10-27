import data from 'data:application/json,%7B%22answer%22%3A42%7D' with { type: 'json' };
import * as namespace from 'data:application/json,%7B%22answer%22%3A42%7D' with { type: 'json' };

export const answer = data.answer;
export { data, namespace };
