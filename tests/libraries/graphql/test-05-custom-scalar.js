import assert from 'assert';
import {
  GraphQLError,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLString,
  Kind,
  graphqlSync,
} from 'graphql';

const DateScalar = new GraphQLScalarType({
  name: 'Date',
  serialize(value) {
    if (!(value instanceof Date)) {
      throw new GraphQLError('Date serialization expects Date instances');
    }
    return value.toISOString();
  },
  parseValue(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new GraphQLError('Invalid date input');
    }
    return date;
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError('Date literals must be strings');
    }
    const date = new Date(ast.value);
    if (Number.isNaN(date.getTime())) {
      throw new GraphQLError('Invalid date literal');
    }
    return date;
  },
});

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      ping: {
        type: GraphQLString,
        resolve: () => 'pong',
      },
      echoDate: {
        type: DateScalar,
        args: {
          input: { type: DateScalar },
        },
        resolve: (_source, args) => args.input,
      },
    },
  }),
});

export const run = () => {
  const validResult = graphqlSync({
    schema,
    source: 'query($value: Date){ echoDate(input: $value) }',
    variableValues: {
      value: '2026-03-09T00:00:00.000Z',
    },
  });

  assert.strictEqual(validResult.errors, undefined);
  assert.strictEqual(validResult.data.echoDate, '2026-03-09T00:00:00.000Z');

  const invalidResult = graphqlSync({
    schema,
    source: 'query($value: Date){ echoDate(input: $value) }',
    variableValues: {
      value: 'not-a-date',
    },
  });

  assert.ok(invalidResult.errors && invalidResult.errors.length > 0);
  assert.match(invalidResult.errors[0].message, /Invalid date input/);

  return 'PASS: custom scalar parse/serialize behavior works';
};
