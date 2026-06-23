declare module 'module-resolution' {
  export function testEsmPackageMapEdgeCases(): Promise<boolean>;
  export function testCjsDirectNamedExports(): Promise<boolean>;
  export function testCjsDefinePropertyNamedExports(): Promise<boolean>;
  export function testCjsReexportNamedExports(): Promise<boolean>;
  export function testCjsAnalyzerFalsePositiveGuards(): Promise<boolean>;
  export function testCjsSharedLoaderIdentity(): Promise<boolean>;
  export function testModuleSyntaxDetectionAndDiagnostics(): Promise<boolean>;
  export function testCjsPackageReexportNamedExports(): Promise<boolean>;
  export function testFindPackageJson(): Promise<boolean>;
  export function testRequireEsmErrorHandling(): Promise<boolean>;
  export function testRequireEsmTlaRetry(): Promise<boolean>;
  export function testRequireEsmCycleGuards(): Promise<boolean>;
  export function testCjsSymlinkCircularCache(): Promise<boolean>;
  export function testCjsNodeModuleLoadingCompat(): Promise<boolean>;
  export function testCjsNestedDependencyCacheShape(): Promise<boolean>;
  export function testCjsModuleChildrenGraph(): Promise<boolean>;
}
