declare module 'response-static' {
  export namespace responseExports {
    export function testResponseError(): ResponseResult;
    export function testResponseRedirect(): ResponseResult;
    export function testResponseRedirectDefault(): ResponseResult;
    export function testResponseJson(): ResponseJsonResult;
    export function testResponseJsonCustomStatus(): ResponseJsonResult;
    export function testResponseJsonString(): ResponseJsonResult;
    export function testResponseJsonWithHeaders(): ResponseJsonHeadersResult;
    export function testResponseRedirectInvalidStatus(): RedirectInvalidResult;
    export type ResponseResult = {
      status: number;
      statusText: string;
      ok: boolean;
      typeField: string;
      location?: string;
    };
    export type ResponseJsonResult = {
      status: number;
      statusText: string;
      contentType: string;
      text: string;
    };
    export type ResponseJsonHeadersResult = {
      status: number;
      statusText: string;
      contentType: string;
      text: string;
      customHeader?: string;
    };
    export type RedirectInvalidResult = {
      success: boolean;
      error: string;
    };
  }
}
