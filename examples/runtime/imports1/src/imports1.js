
import * as random from 'wasi:random/random@0.2.3';

export const test = (input) => {
    let num = random.getRandomU64();
    return `${input} - ${num}`;
};