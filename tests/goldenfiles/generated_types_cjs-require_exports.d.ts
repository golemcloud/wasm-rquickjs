declare module 'cjs-require' {
  export function testRequireBuiltin(): Promise<boolean>;
  export function testRequireRelative(): Promise<boolean>;
  export function testRequireDirectory(): Promise<boolean>;
  export function testRequireCircular(): Promise<boolean>;
  export function testRequireCache(): Promise<boolean>;
  export function testCreateRequire(): Promise<boolean>;
  export function testRequireJson(): Promise<boolean>;
  export function testRequireModuleExportsFunction(): Promise<boolean>;
  export function testRequireModuleNotFound(): Promise<boolean>;
}
