import assert from 'assert';
import neo4j from 'neo4j-driver';

export const run = async () => {
  const manager = neo4j.bookmarkManager({
    initialBookmarks: ['bm:init'],
    bookmarksSupplier: async () => ['bm:external'],
  });

  const initial = await manager.getBookmarks();
  assert.ok(initial.includes('bm:init'));
  assert.ok(initial.includes('bm:external'));

  await manager.updateBookmarks(['bm:init'], ['bm:new']);
  const updated = await manager.getBookmarks();
  assert.ok(updated.includes('bm:new'));

  return 'PASS: bookmark manager merges supplied and tracked bookmarks';
};
