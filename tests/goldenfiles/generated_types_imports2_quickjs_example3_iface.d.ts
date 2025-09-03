declare module 'quickjs:example3/iface' {
  export function dump(h: Hello | undefined): string;
  export function dumpAll(hs: Hello[]): string;
  export class Hello {
    constructor(name: string);
    getName(): string;
    static compare(h1: Hello, h2: Hello): number;
    static merge(h1: Hello, h2: Hello): Hello;
  }
}
