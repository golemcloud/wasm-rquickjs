declare module 'stateful1' {
  export function inc(delta: number): Promise<void>;
  export function get(): Promise<number>;
}
