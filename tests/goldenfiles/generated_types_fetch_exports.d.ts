declare module 'fetch' {
  export function postJsonAndGet(port: number): Promise<void>;
  export function postAndGetAsArrayBuffer(port: number): Promise<void>;
  export function streamingResponseBody(port: number): Promise<void>;
  export function pipeResponseBodyToRequest(port: number): Promise<void>;
  export function pipeBufferedResponseBodyToRequest(port: number): Promise<void>;
  export function concurrentPostAndGet(port: number): Promise<void>;
  export function postWithSlowStreamingBody(port: number): Promise<void>;
  export function blobOperations(): Promise<void>;
  export function postWithBlobBody(port: number): Promise<void>;
  export function postFormDataWithFiles(port: number): Promise<void>;
  export function fetchWithRequestObject(port: number): Promise<void>;
  export function postWithDataViewBody(port: number): Promise<void>;
  export function postWithUrlSearchParams(port: number): Promise<void>;
  export function requestWithUrlSearchParams(port: number): Promise<void>;
  export function fetchWithReferrer(port: number): Promise<void>;
  export function fetchWithReferrerPolicy(port: number): Promise<void>;
  export function fetchWithCredentials(port: number): Promise<void>;
  export function redirectFollow(port: number): Promise<void>;
  export function redirectManual(port: number): Promise<void>;
  export function redirectError(port: number): Promise<void>;
  export function redirectLoop(port: number): Promise<void>;
  export function postWithRedirect(port: number): Promise<void>;
  export function responseCloneBasic(port: number): Promise<void>;
  export function responseCloneStreamingBody(port: number): Promise<void>;
  export function responseCloneReuseBodies(port: number): Promise<void>;
  export function responseCloneHeaders(port: number): Promise<void>;
  export function responseFormData(port: number): Promise<void>;
}
