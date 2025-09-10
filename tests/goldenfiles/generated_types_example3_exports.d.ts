declare module 'example3' {
  /**
   * The exported interface
   */
  export namespace iface {
    /**
     * Dump function
     */
    export function dump(h: Hello | undefined): Promise<string>;
    export function dumpAll(hs: Hello[]): Promise<string>;
    export class Hello {
      /**
       * Creates an instance of the example resource
       */
      constructor(name: string);
      /**
       * Gets the name passed to the constructor
       */
      getName(): Promise<string>;
      /**
       * Example of a static method
       */
      static compare(h1: Hello, h2: Hello): Promise<number>;
      /**
       * Example of a static method taking owned handles
       */
      static merge(h1: Hello, h2: Hello): Promise<Hello>;
    }
    export class HelloWithStaticCreate {
      static create(name: string): Promise<HelloWithStaticCreate>;
      getName(): Promise<string>;
      static compare(h1: Hello, h2: Hello): Promise<number>;
      static merge(h1: Hello, h2: Hello): Promise<Hello>;
    }
  }
}
