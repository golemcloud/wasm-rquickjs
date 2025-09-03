/**
 * This interface defines a handler of outgoing HTTP Requests. It should be
 * imported by components which wish to make HTTP Requests.
 */
declare module 'wasi:http/outgoing-handler@0.2.3' {
  import * as wasiHttp023Types from 'wasi:http/types@0.2.3';
  /**
   * This function is invoked with an outgoing HTTP Request, and it returns
   * a resource `future-incoming-response` which represents an HTTP Response
   * which may arrive in the future.
   * The `options` argument accepts optional parameters for the HTTP
   * protocol's transport layer.
   * This function may return an error if the `outgoing-request` is invalid
   * or not allowed to be made. Otherwise, protocol errors are reported
   * through the `future-incoming-response`.
   */
  export function handle(request: OutgoingRequest, options: RequestOptions | undefined): Result<FutureIncomingResponse, ErrorCode>;
  export type OutgoingRequest = wasiHttp023Types.OutgoingRequest;
  export type RequestOptions = wasiHttp023Types.RequestOptions;
  export type FutureIncomingResponse = wasiHttp023Types.FutureIncomingResponse;
  export type ErrorCode = wasiHttp023Types.ErrorCode;
  export type Result<T, E> = { tag: 'ok', val: T } | { tag: 'err', val: E };
}
