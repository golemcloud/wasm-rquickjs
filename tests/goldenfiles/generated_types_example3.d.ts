declare module 'example3' {
  export module iface {
    export function dump(h: Hello | undefined): Promise<string>;
    export function dumpAll(hs: Hello[]): Promise<string>;
    export class Hello {
      constructor(name: string);
      async getName(): Promise<string>;
      static async compare(h1: Hello, h2: Hello): Promise<number>;
      static async merge(h1: Hello, h2: Hello): Promise<Hello>;
    }
  }
}
