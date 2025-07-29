declare module 'timeout' {
  export function run(): Promise<void>;
  export function parallel(): Promise<void>;
}
