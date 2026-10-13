declare module 'quickjs:error-provider/api' {
  /**
   * @throws Failure
   */
  export function fail(kind: string): string;
  /**
   * @throws Status
   */
  export function failEnum(): string;
  /**
   * @throws string
   */
  export function failString(): string;
  /**
   * @throws RecordError
   */
  export function failRecord(): string;
  export class Gate {
    constructor();
    /**
     * @throws Failure
     */
    static failStatic(kind: string): string;
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
