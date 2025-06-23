
import * as types from 'quickjs:types-in-exports/types';

export const test = () => {
    console.log(`f1: ${types.f1([0.1, 0.2, 0.3], ["a", "b"])}`);
};
