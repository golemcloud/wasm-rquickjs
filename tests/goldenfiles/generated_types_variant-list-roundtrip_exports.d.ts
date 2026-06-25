declare module 'variant-list-roundtrip' {
  export namespace api {
    export function roundtripItems(items: Item[]): Promise<Item[]>;
    export function roundtripPayload(payload: Payload): Promise<Payload>;
    export function roundtripEnvelope(envelope: Envelope): Promise<Envelope>;
    export function roundtripNumber(value: number): Promise<number>;
    export function roundtripResults(items: Result<number, string>[]): Promise<Result<number, string>[]>;
    export function roundtripOptions(items: number | undefined[]): Promise<number | undefined[]>;
    export function roundtripColors(items: Color[]): Promise<Color[]>;
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
