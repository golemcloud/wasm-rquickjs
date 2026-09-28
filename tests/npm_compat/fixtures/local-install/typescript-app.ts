import fixtureDependency from 'fixture-dependency';

enum RuntimeMode {
  TypeScript = 'typescript',
}

const dependency = fixtureDependency();

export default function run(): {
  answer: number;
  runtime: RuntimeMode;
  dependencyKind: string;
} {
  return {
    answer: 40 + 2,
    runtime: RuntimeMode.TypeScript,
    dependencyKind: dependency.kind,
  };
}
