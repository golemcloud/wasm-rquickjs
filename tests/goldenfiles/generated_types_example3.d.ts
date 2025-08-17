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
      async getName(): Promise<string>;
      /**
       * Example of a static method
       */
      static async compare(h1: Hello, h2: Hello): Promise<number>;
      /**
       * Example of a static method taking owned handles
       */
      static async merge(h1: Hello, h2: Hello): Promise<Hello>;
    }
  }
}
