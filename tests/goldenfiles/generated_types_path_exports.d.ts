declare module 'path' {
  export function testBasename(): Promise<boolean>;
  export function testDirname(): Promise<boolean>;
  export function testExtname(): Promise<boolean>;
  export function testIsAbsolute(): Promise<boolean>;
  export function testJoin(): Promise<boolean>;
  export function testNormalize(): Promise<boolean>;
  export function testRelative(): Promise<boolean>;
  export function testResolve(): Promise<boolean>;
  export function testParseFormat(): Promise<boolean>;
  export function testDelimiter(): Promise<boolean>;
  export function testSep(): Promise<boolean>;
}
