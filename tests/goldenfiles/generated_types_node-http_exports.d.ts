declare module 'node-http' {
  export function httpGet(port: number): Promise<void>;
  export function httpPostJson(port: number): Promise<void>;
  export function httpRequestWithHeaders(port: number): Promise<void>;
  export function httpConstants(): Promise<void>;
  export function httpSelfConnect(): Promise<void>;
  export function httpSelfConnectPost(): Promise<void>;
}
