declare module 'error-consumer' {
  export function observe(): Promise<string>;
  export namespace output {
    /**
     * @throws Failure
     */
    export function rethrow(kind: string): Promise<string>;
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
    export type Result<T, E> = { tag: 'ok', val: T } | { tag: 'err', val: E };
  }
}
