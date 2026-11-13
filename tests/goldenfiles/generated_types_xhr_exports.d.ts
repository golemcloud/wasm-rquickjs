declare module 'xhr' {
  export function simpleGet(port: number): void;
  export function simplePost(port: number): void;
  export function setRequestHeaders(port: number): void;
  export function getResponseHeaders(port: number): void;
  export function responseTypes(port: number): void;
  export function readystateEvents(port: number): void;
  export function errorHandling(port: number): void;
  export function abortRequest(port: number): void;
  export function timeoutHandling(port: number): void;
  export function requestWithBasicAuth(port: number): void;
  export function postWithFormData(port: number): void;
  export function postWithJsonBody(port: number): void;
  export function statusIsNumber(port: number): void;
}
