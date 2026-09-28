declare module 'p2-exported-resource' {
  export namespace api {
    export class Counter {
      constructor(value: number);
      get(): Promise<number>;
      static identity(value: Counter): Promise<Counter>;
      /**
       * @throws string
       */
      static stashAndFail(value: Counter): Promise<void>;
      static take(): Promise<Counter>;
      static resourceCount(): Promise<number>;
    }
    export type Result<T, E> = { tag: 'ok', val: T } | { tag: 'err', val: E };
  }
}
