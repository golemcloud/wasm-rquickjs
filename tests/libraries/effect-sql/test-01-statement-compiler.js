import assert from "assert";
import * as Statement from "@effect/sql/Statement";

export const run = () => {
  const compiler = Statement.makeCompilerSqlite();

  const whereClause = Statement.or([
    Statement.and([
      Statement.unsafeFragment("age > ?", [18]),
      Statement.unsafeFragment("active = ?", [1]),
    ]),
    Statement.unsafeFragment("role = ?", ["admin"]),
  ]);

  const [whereSql, whereParams] = compiler.compile(whereClause, false);
  assert.strictEqual(whereSql, "((age > ? AND active = ?) OR role = ?)");
  assert.deepStrictEqual(whereParams, [18, 1, "admin"]);

  const joined = Statement.join(" OR ")([
    Statement.unsafeFragment("name = ?", ["Alice"]),
    Statement.unsafeFragment("email = ?", ["alice@example.com"]),
  ]);
  const [joinedSql, joinedParams] = compiler.compile(joined, false);
  assert.strictEqual(joinedSql, "(name = ? OR email = ?)");
  assert.deepStrictEqual(joinedParams, ["Alice", "alice@example.com"]);

  return "PASS: Statement compiler handles and/or/join fragments";
};
