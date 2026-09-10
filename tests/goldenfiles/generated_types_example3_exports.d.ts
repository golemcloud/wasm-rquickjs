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
       * Compares this instance with another borrowed instance
       */
      compareWith(other: Hello): Promise<number>;
      /**
       * Example of a static method
       */
      static compare(h1: Hello, h2: Hello): Promise<number>;
      /**
       * Example of a static method taking owned handles
       */
      static merge(h1: Hello, h2: Hello): Promise<Hello>;
      /**
       * Transfers an owned handle through JavaScript without changing its identity
       */
      static identity(value: Hello): Promise<Hello>;
      /**
       * Creates another owned handle for the same JavaScript object
       */
      static alias(value: Hello): Promise<Hello>;
      /**
       * Retains a transferred object in JavaScript after its final host handle is dropped
       */
      static stash(value: Hello): Promise<void>;
      /**
       * Retains a transferred object and returns an expected error
       * @throws string
       */
      static stashAndFail(value: Hello): Promise<void>;
      /**
       * Returns the object retained by `stash`
       */
      static take(): Promise<Hello>;
    }
    export class HelloWithStaticCreate {
      static create(name: string): Promise<HelloWithStaticCreate>;
      getName(): Promise<string>;
      static compare(h1: Hello, h2: Hello): Promise<number>;
      static merge(h1: Hello, h2: Hello): Promise<Hello>;
    }
    export type Result<T, E> = { tag: 'ok', val: T } | { tag: 'err', val: E };
  }
}
