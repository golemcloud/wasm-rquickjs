import assert from 'assert';
import { UriTemplate } from '@modelcontextprotocol/sdk/shared/uriTemplate.js';
import { validateToolName } from '@modelcontextprotocol/sdk/shared/toolNameValidation.js';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';

export const run = () => {
  const template = new UriTemplate('mcp://tools/{tool}/items/{id}{?verbose}');

  const expanded = template.expand({ tool: 'math', id: '42', verbose: 'true' });
  assert.strictEqual(expanded, 'mcp://tools/math/items/42?verbose=true');

  const match = template.match('mcp://tools/search/items/99?verbose=false');
  assert.ok(match);
  assert.strictEqual(match.tool, 'search');
  assert.strictEqual(match.id, '99');
  assert.strictEqual(match.verbose, 'false');

  assert.strictEqual(UriTemplate.isTemplate('mcp://tools/{id}'), true);
  assert.strictEqual(UriTemplate.isTemplate('mcp://tools/static'), false);

  const validName = validateToolName('tool_v1.2-ok');
  assert.strictEqual(validName.isValid, true);

  const invalidName = validateToolName('bad name');
  assert.strictEqual(invalidName.isValid, false);
  assert.ok(invalidName.warnings.some((w) => w.includes('spaces')));

  const error = McpError.fromError(ErrorCode.InvalidParams, 'Bad params', { field: 'id' });
  assert.strictEqual(error.code, ErrorCode.InvalidParams);
  assert.ok(error.message.includes('Bad params'));
  assert.deepStrictEqual(error.data, { field: 'id' });

  return 'PASS: URI templates, tool name validation, and McpError helpers work';
};
