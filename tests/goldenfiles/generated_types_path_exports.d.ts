declare module 'path' {
  export function testBasename(): boolean;
  export function testDirname(): boolean;
  export function testExtname(): boolean;
  export function testIsAbsolute(): boolean;
  export function testJoin(): boolean;
  export function testNormalize(): boolean;
  export function testRelative(): boolean;
  export function testResolve(): boolean;
  export function testParseFormat(): boolean;
  export function testDelimiter(): boolean;
  export function testSep(): boolean;
}
