declare module 'example3' {
  /**
   * The exported interface
   */
  export namespace iface {
    /**
     * Dump function
     */
    export function dump(h: Hello | undefined): string;
    export function dumpAll(hs: Hello[]): string;
    export class Hello {
      /**
       * Creates an instance of the example resource
       */
      constructor(name: string);
      /**
       * Gets the name passed to the constructor
       */
      getName(): string;
      /**
       * Compares this instance with another borrowed instance
       */
      compareWith(other: Hello): number;
      /**
       * Example of a static method
       */
      static compare(h1: Hello, h2: Hello): number;
      /**
       * Example of a static method taking owned handles
       */
      static merge(h1: Hello, h2: Hello): Hello;
      /**
       * Transfers an owned handle through JavaScript without changing its identity
       */
      static identity(value: Hello): Hello;
      /**
       * Creates another owned handle for the same JavaScript object
       */
      static alias(value: Hello): Hello;
      /**
       * Creates two owned handles for the same JavaScript object
       */
      static duplicate(value: Hello): [Hello, Hello];
      /**
       * Retains a transferred object in JavaScript after its final host handle is dropped
       */
      static stash(value: Hello): void;
      /**
       * Retains a transferred object and returns an expected error
       * @throws string
       */
      static stashAndFail(value: Hello): void;
      /**
       * Returns the object retained by `stash`
       */
      static take(): Hello;
      /**
       * Reports the number of live entries in the exported-resource table
       */
      static resourceCount(): number;
    }
    export class HelloWithStaticCreate {
      static create(name: string): HelloWithStaticCreate;
      getName(): string;
      static compare(h1: Hello, h2: Hello): number;
      static merge(h1: Hello, h2: Hello): Hello;
    }
    export type Result<T, E> = { tag: 'ok', val: T } | { tag: 'err', val: E };
  }
}
