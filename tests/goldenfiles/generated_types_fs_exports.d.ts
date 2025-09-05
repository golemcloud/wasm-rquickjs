declare module 'fs' {
  export function runAsync(): Promise<void>;
  export function run(): Promise<void>;
}
