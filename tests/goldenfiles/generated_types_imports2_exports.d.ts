declare module 'imports2' {
  export function test(name: string): Promise<string>;
  export function testStaticCreate(name: string): Promise<string>;
}
