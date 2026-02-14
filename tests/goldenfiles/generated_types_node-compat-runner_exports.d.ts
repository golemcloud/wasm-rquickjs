declare module 'node-compat-runner' {
  export function runTest(testPath: string): Promise<string>;
}
