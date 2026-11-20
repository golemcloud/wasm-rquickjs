declare module 'variant-list-roundtrip' {
  export namespace api {
    export function roundtripItems(items: Item[]): Item[];
    export function roundtripPayload(payload: Payload): Payload;
    export function roundtripEnvelope(envelope: Envelope): Envelope;
    export function roundtripNumber(value: number): number;
    export function roundtripResults(items: Result<number, string>[]): Result<number, string>[];
    export function roundtripOptions(items: number | undefined[]): number | undefined[];
    export function roundtripColors(items: Color[]): Color[];
    export type Item =
    {
      tag: 'empty'
    } |
    {
      tag: 'number'
      val: number
    } |
    {
      tag: 'label'
      val: string
    };
    export type Payload = {
      items: Item[];
    };
    export type Envelope =
    {
      tag: 'none'
    } |
    {
      tag: 'batch'
      val: Payload
    } |
    {
      tag: 'direct'
      val: Item[]
    };
    export type Color = "red" | "green" | "blue";
    export type Result<T, E> = { tag: 'ok', val: T } | { tag: 'err', val: E };
  }
}
