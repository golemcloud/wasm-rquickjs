declare module 'response-static' {
  export namespace responseExports {
    export function testResponseError(): Promise<ResponseResult>;
    export function testResponseRedirect(): Promise<ResponseResult>;
    export function testResponseRedirectDefault(): Promise<ResponseResult>;
    export function testResponseJson(): Promise<ResponseJsonResult>;
    export function testResponseJsonCustomStatus(): Promise<ResponseJsonResult>;
    export function testResponseJsonString(): Promise<ResponseJsonResult>;
    export function testResponseJsonWithHeaders(): Promise<ResponseJsonHeadersResult>;
    export function testResponseRedirectInvalidStatus(): Promise<RedirectInvalidResult>;
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
