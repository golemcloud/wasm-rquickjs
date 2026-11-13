declare module 'cjs-require' {
  export function testRequireBuiltin(): boolean;
  export function testRequireRelative(): boolean;
  export function testRequireDirectory(): boolean;
  export function testRequireCircular(): boolean;
  export function testRequireCache(): boolean;
  export function testCreateRequire(): boolean;
  export function testRequireJson(): boolean;
  export function testRequireExtensionsOrder(): boolean;
  export function testRequireModuleExportsFunction(): boolean;
  export function testRequireModuleNotFound(): boolean;
  export function testRequirePackageExports(): boolean;
  export function testRequirePackageImports(): boolean;
  export function testRequirePackageMapEdgeCases(): boolean;
}
