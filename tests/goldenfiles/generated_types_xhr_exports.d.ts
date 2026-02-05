declare module 'xhr' {
  export function simpleGet(port: number): Promise<void>;
  export function simplePost(port: number): Promise<void>;
  export function setRequestHeaders(port: number): Promise<void>;
  export function getResponseHeaders(port: number): Promise<void>;
  export function responseTypes(port: number): Promise<void>;
  export function readystateEvents(port: number): Promise<void>;
  export function errorHandling(port: number): Promise<void>;
  export function abortRequest(port: number): Promise<void>;
  export function timeoutHandling(port: number): Promise<void>;
  export function requestWithBasicAuth(port: number): Promise<void>;
  export function postWithFormData(port: number): Promise<void>;
  export function postWithJsonBody(port: number): Promise<void>;
  export function statusIsNumber(port: number): Promise<void>;
}
