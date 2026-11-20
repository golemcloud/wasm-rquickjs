declare module 'exported-resource-ownership' {
  export namespace api {
    export class Counter {
      constructor(value: number);
      get(): number;
      static identity(value: Counter): Promise<Counter>;
      static identityUnref(value: Counter): Promise<Counter>;
      /**
       * @throws string
       */
      static stashAndFail(value: Counter): Promise<void>;
      static take(): Counter;
      static resourceCount(): number;
    }
    export type Result<T, E> = { tag: 'ok', val: T } | { tag: 'err', val: E };
  }
}
