declare module 'glob' {
  export function matcherContract(): Promise<boolean>;
  export function syncContract(): Promise<boolean>;
  export function callbackContract(): Promise<boolean>;
  export function iteratorContract(): Promise<boolean>;
  export function exclusionContract(): Promise<boolean>;
  export function symlinkContract(): Promise<boolean>;
}
