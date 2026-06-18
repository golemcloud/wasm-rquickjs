import { createRequire as makeRequire } from 'node:module';

const req = makeRequire(import.meta.url);
const bridge = req('./bridge.cjs');

export const value = bridge.value;
export default { value };
