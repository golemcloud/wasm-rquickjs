declare module 'node-modules-app-runner' {
  export function runTest(testPath: string): Promise<string>;
}
