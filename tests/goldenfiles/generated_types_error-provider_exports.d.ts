declare module 'error-provider' {
  export namespace api {
    /**
     * @throws Failure
     */
    export function fail(kind: string): Promise<string>;
    /**
     * @throws Status
     */
    export function failEnum(): Promise<string>;
    /**
     * @throws string
     */
    export function failString(): Promise<string>;
    /**
     * @throws RecordError
     */
    export function failRecord(): Promise<string>;
    export class Gate {
      constructor();
      /**
       * @throws Failure
       */
      static failStatic(kind: string): Promise<string>;
    }
    export type Detail =
    {
      tag: 'permission-denied'
    } |
    {
      tag: 'unavailable'
      val: string
    };
    export type Failure =
    {
      tag: 'permission-denied'
    } |
    {
      tag: 'backend-error'
      val: string
    } |
    {
      tag: 'nested'
      val: Detail
    };
    export type Status = "permission-denied" | "unavailable";
    export type RecordError = {
      tag: string;
      toString: string;
      count: bigint;
    };
    export type Result<T, E> = { tag: 'ok', val: T } | { tag: 'err', val: E };
  }
}
