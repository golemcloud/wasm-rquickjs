export default function registryDependency() {
  return {
    kind: 'registry-pure-javascript',
    loadedFrom: import.meta.url,
  };
}
