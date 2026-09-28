export default function fixtureDependency() {
  return {
    kind: 'pure-javascript',
    loadedFrom: import.meta.url,
  };
}
