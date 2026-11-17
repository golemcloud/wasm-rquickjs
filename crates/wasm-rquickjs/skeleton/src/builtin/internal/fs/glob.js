// Traversal adapted from Node.js v22.14.0 lib/internal/fs/glob.js.
// See ../glob.NOTICES for the complete license and adaptation provenance.
import { join, resolve, basename, dirname, isAbsolute } from 'node:path';
import { validateObject, validateString, validateStringArray } from '__wasm_rquickjs_builtin/internal/validators';
import { ERR_INVALID_ARG_TYPE } from '__wasm_rquickjs_builtin/internal/errors';
import { createMatcher, GLOBSTAR } from '__wasm_rquickjs_builtin/internal/glob_matcher';

const ArrayFrom = Array.from;
const ArrayIsArray = Array.isArray;
const ArrayPrototypeAt = Function.prototype.call.bind(Array.prototype.at);
const ArrayPrototypeMap = Function.prototype.call.bind(Array.prototype.map);
const ArrayPrototypeFlatMap = Function.prototype.call.bind(Array.prototype.flatMap);
const ArrayPrototypeSome = Function.prototype.call.bind(Array.prototype.some);
const ArrayPrototypePush = Function.prototype.call.bind(Array.prototype.push);
const ArrayPrototypePop = Function.prototype.call.bind(Array.prototype.pop);
const MapConstructor = Map;
const SetConstructor = Set;
const kEmptyObject = Object.freeze({ __proto__: null });

function validateStringArrayOrFunction(value, name) {
    if (ArrayIsArray(value)) {
        validateStringArray(value, name);
    } else if (typeof value !== 'function') {
        throw new ERR_INVALID_ARG_TYPE(name, ['string[]', 'function'], value);
    }
}

class Cache {
    #cache = new MapConstructor();
    #statsCache = new MapConstructor();
    #readdirCache = new MapConstructor();

    *stat(path) {
        const cached = this.#statsCache.get(path);
        if (cached) return cached;
        const value = yield { type: 'stat', path };
        this.#statsCache.set(path, value);
        return value;
    }
    *readdir(path) {
        const cached = this.#readdirCache.get(path);
        if (cached) return cached;
        const value = yield { type: 'readdir', path };
        this.#readdirCache.set(path, value);
        return value;
    }
    addToStatCache(path, value) { this.#statsCache.set(path, value); }
    add(path, pattern) {
        let cached = this.#cache.get(path);
        if (!cached) this.#cache.set(path, cached = new SetConstructor());
        const originalSize = cached.size;
        pattern.indexes.forEach(index => cached.add(pattern.cacheKey(index)));
        return cached.size !== originalSize + pattern.indexes.size;
    }
    seen(path, pattern, index) { return this.#cache.get(path)?.has(pattern.cacheKey(index)); }
    clear() {
        this.#cache.clear();
        this.#statsCache.clear();
        this.#readdirCache.clear();
    }
}

// Convert the public Stats result once, retaining the real public Dirent class.
// Filesystem access remains owned by the existing fs bindings.
const direntMethods = ['isFile', 'isDirectory', 'isSymbolicLink', 'isFIFO', 'isSocket', 'isCharacterDevice', 'isBlockDevice'];
function direntFromStats(io, path, stat) {
    if (!stat) return null;
    let type = 0;
    for (let i = 0; i < direntMethods.length; i++) {
        if (stat[direntMethods[i]]()) { type = i + 1; break; }
    }
    const Dirent = io.Dirent();
    return new Dirent(basename(path), type, dirname(path));
}

function readSync(io, request) {
    if (request.type === 'stat') {
        try { return direntFromStats(io, request.path, io.lstatSync(request.path)); }
        catch (error) {
            if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') return null;
            throw error;
        }
    }
    try { return io.readdirSync(request.path, { withFileTypes: true }); }
    catch { return []; }
}

async function readAsync(io, request) {
    if (request.type === 'stat') {
        try { return direntFromStats(io, request.path, await io.lstat(request.path)); }
        catch { return null; }
    }
    try { return await io.readdir(request.path, { withFileTypes: true }); }
    catch { return null; }
}

function runSync(iterator, io) {
    let step = iterator.next();
    while (!step.done) step = iterator.next(readSync(io, step.value));
    return step.value;
}

class Pattern {
  #pattern;
  #globStrings;
  indexes;
  symlinks;
  last;

  constructor(pattern, globStrings, indexes, symlinks) {
    this.#pattern = pattern;
    this.#globStrings = globStrings;
    this.indexes = indexes;
    this.symlinks = symlinks;
    this.last = pattern.length - 1;
  }

  isLast(isDirectory) {
    return this.indexes.has(this.last) ||
      (this.at(-1) === '' && isDirectory &&
      this.indexes.has(this.last - 1) && this.at(-2) === GLOBSTAR);
  }
  isFirst() {
    return this.indexes.has(0);
  }
  get hasSeenSymlinks() {
    return ArrayPrototypeSome(ArrayFrom(this.indexes), (i) => !this.symlinks.has(i));
  }
  at(index) {
    return ArrayPrototypeAt(this.#pattern, index);
  }
  child(indexes, symlinks = new SetConstructor()) {
    return new Pattern(this.#pattern, this.#globStrings, indexes, symlinks);
  }
  test(index, path) {
    if (index > this.#pattern.length) {
      return false;
    }
    const pattern = this.#pattern[index];
    if (pattern === GLOBSTAR) {
      return true;
    }
    if (typeof pattern === 'string') {
      return pattern === path;
    }
    if (typeof pattern?.test === 'function') {
      return pattern.test(path);
    }
    return false;
  }

  cacheKey(index) {
    let key = '';
    for (let i = index; i < this.#globStrings.length; i++) {
      key += this.#globStrings[i];
      if (i !== this.#globStrings.length - 1) {
        key += '/';
      }
    }
    return key;
  }
}

class ResultSet extends SetConstructor {
  #root = '.';
  #isExcluded = () => false;
  constructor(i) { super(i); } // eslint-disable-line no-useless-constructor

  setup(root, isExcludedFn) {
    this.#root = root;
    this.#isExcluded = isExcludedFn;
  }

  add(value) {
    if (this.#isExcluded(resolve(this.#root, value))) {
      return false;
    }
    super.add(value);
    return true;
  }
}

class Glob {
  #io;
  #root;
  #exclude;
  #cache = new Cache();
  #results = new ResultSet();
  #queue = [];
  #subpatterns = new MapConstructor();
  #patterns;
  #withFileTypes;
  #isExcluded = () => false;
  constructor(pattern, options = kEmptyObject, io) {
    this.#io = io;
    validateObject(options, 'options');
    const { exclude, cwd, withFileTypes } = options;
    this.#root = cwd ?? '.';
    this.#withFileTypes = !!withFileTypes;
    if (exclude != null) {
      validateStringArrayOrFunction(exclude, 'options.exclude');
      if (ArrayIsArray(exclude)) {
        if (typeof this.#root !== 'string') throw new ERR_INVALID_ARG_TYPE('options.cwd', 'string', this.#root);
        // Convert the path part of exclude patterns to absolute paths for
        // consistent comparison before instantiating matchers.
        const matchers = exclude
          .map((pattern) => resolve(this.#root, pattern))
          .map((pattern) => createMatcher(pattern));
        this.#isExcluded = (value) =>
          matchers.some((matcher) => matcher.match(value));
        this.#results.setup(this.#root, this.#isExcluded);
      } else {
        this.#exclude = exclude;
      }
    }
    let patterns;
    if (typeof pattern === 'object') {
      validateStringArray(pattern, 'patterns');
      patterns = pattern;
    } else {
      validateString(pattern, 'patterns');
      patterns = [pattern];
    }
    this.matchers = ArrayPrototypeMap(patterns, (pattern) => createMatcher(pattern));
    this.#patterns = ArrayPrototypeFlatMap(this.matchers, (matcher) => ArrayPrototypeMap(matcher.set,
                                                                                         (pattern, i) => new Pattern(
                                                                                           pattern,
                                                                                           matcher.globParts[i],
                                                                                           new SetConstructor().add(0),
                                                                                           new SetConstructor(),
                                                                                         )));
  }

  *#walk() {
    ArrayPrototypePush(this.#queue, { path: '.', patterns: this.#patterns });
    while (this.#queue.length > 0) {
      const item = ArrayPrototypePop(this.#queue);
      for (let i = 0; i < item.patterns.length; i++)
        yield* this.#iterateSubpatterns(item.path, item.patterns[i]);
      this.#subpatterns.forEach((patterns, path) => ArrayPrototypePush(this.#queue, { path, patterns }));
      this.#subpatterns.clear();
    }
  }

  #dispose() {
    this.#queue.length = 0;
    this.#patterns.length = 0;
    this.matchers.length = 0;
    this.#subpatterns.clear();
    this.#cache.clear();
    this.#results.clear();
    this.#exclude = undefined;
    this.#isExcluded = () => false;
    this.#results.setup('.', this.#isExcluded);
  }

  globSync() {
    const walk = this.#walk();
    try {
      let step = walk.next();
      while (!step.done) {
        if (step.value.type === 'match') step = walk.next();
        else step = walk.next(readSync(this.#io, step.value));
      }
      // Node's sync API materializes Dirents after traversal, from the same
      // per-operation cache. The async API yields them at each match.
      return ArrayFrom(this.#results, this.#withFileTypes ? path => runSync(
        this.#cache.stat(isAbsolute(path) ? path : join(this.#root, path)), this.#io,
      ) : undefined);
    } finally {
      walk.return();
      this.#dispose();
    }
  }

  async* glob() {
    const walk = this.#walk();
    try {
      let step = walk.next();
      while (!step.done) {
        if (step.value.type === 'match') {
          yield step.value.value;
          step = walk.next();
        } else {
          step = walk.next(await readAsync(this.#io, step.value));
        }
      }
    } finally {
      walk.return();
      this.#dispose();
    }
  }
  #addSubpattern(path, pattern) {
    if (this.#isExcluded(path)) {
      return;
    }
    if (!this.#subpatterns.has(path)) {
      this.#subpatterns.set(path, [pattern]);
    } else {
      ArrayPrototypePush(this.#subpatterns.get(path), pattern);
    }
  }
  * #iterateSubpatterns(path, pattern) {
    const seen = this.#cache.add(path, pattern);
    if (seen) {
      return;
    }
    const fullpath = resolve(this.#root, path);
    const stat = yield* this.#cache.stat(fullpath);
    const last = pattern.last;
    const isDirectory = stat?.isDirectory() || (stat?.isSymbolicLink() && pattern.hasSeenSymlinks);
    const isLast = pattern.isLast(isDirectory);
    const isFirst = pattern.isFirst();

    if (this.#isExcluded(fullpath)) {
      return;
    }
    if (isFirst && pattern.at(0) === '') {
      // Absolute path, go to root
      this.#addSubpattern('/', pattern.child(new SetConstructor().add(1)));
      return;
    }
    if (isFirst && pattern.at(0) === '..') {
      // Start with .., go to parent
      this.#addSubpattern('../', pattern.child(new SetConstructor().add(1)));
      return;
    }
    if (isFirst && pattern.at(0) === '.') {
      // Start with ., proceed
      this.#addSubpattern('.', pattern.child(new SetConstructor().add(1)));
      return;
    }

    if (isLast && typeof pattern.at(-1) === 'string') {
      // Add result if it exists
      const p = pattern.at(-1);
      const stat = yield* this.#cache.stat(join(fullpath, p));
      if (stat && (p || isDirectory)) {
        const result = join(path, p);
        if (!this.#results.has(result)) {
          if (this.#results.add(result)) {
            yield { type: 'match', path: result, value: this.#withFileTypes ? stat : result };
          }
        }
      }
      if (pattern.indexes.size === 1 && pattern.indexes.has(last)) {
        return;
      }
    } else if (isLast && pattern.at(-1) === GLOBSTAR &&
     (path !== '.' || pattern.at(0) === '.' || (last === 0 && stat))) {
      // If pattern ends with **, add to results
      // if path is ".", add it only if pattern starts with "." or pattern is exactly "**"
      if (!this.#results.has(path)) {
        if (this.#results.add(path)) {
          yield { type: 'match', path: path, value: this.#withFileTypes ? stat : path };
        }
      }
    }

    if (!isDirectory) {
      return;
    }

    let children;
    const firstPattern = pattern.indexes.size === 1 && pattern.at(pattern.indexes.values().next().value);
    if (typeof firstPattern === 'string') {
      const stat = yield* this.#cache.stat(join(fullpath, firstPattern));
      if (stat) {
        stat.name = firstPattern;
        children = [stat];
      } else {
        return;
      }
    } else {
      children = yield* this.#cache.readdir(fullpath);
    }

    for (let i = 0; i < children.length; i++) {
      const entry = children[i];
      const entryPath = join(path, entry.name);
      this.#cache.addToStatCache(join(fullpath, entry.name), entry);

      const subPatterns = new SetConstructor();
      const nSymlinks = new SetConstructor();
      for (const index of pattern.indexes) {
        // For each child, check potential patterns
        if (this.#cache.seen(entryPath, pattern, index) || this.#cache.seen(entryPath, pattern, index + 1)) {
          return;
        }
        const current = pattern.at(index);
        const nextIndex = index + 1;
        const next = pattern.at(nextIndex);
        const fromSymlink = pattern.symlinks.has(index);

        if (current === GLOBSTAR) {
          if (entry.name[0] === '.' || (this.#exclude && this.#exclude(this.#withFileTypes ? entry : entry.name))) {
            continue;
          }
          if (!fromSymlink && entry.isDirectory()) {
            // If directory, add ** to its potential patterns
            subPatterns.add(index);
          } else if (!fromSymlink && index === last) {
            // If ** is last, add to results
            if (!this.#results.has(entryPath)) {
              if (this.#results.add(entryPath)) {
                yield { type: 'match', path: entryPath, value: this.#withFileTypes ? entry : entryPath };
              }
            }
          }

          // Any pattern after ** is also a potential pattern
          // so we can already test it here
          const nextMatches = pattern.test(nextIndex, entry.name);
          if (nextMatches && nextIndex === last && !isLast) {
            // If next pattern is the last one, add to results
            if (!this.#results.has(entryPath)) {
              if (this.#results.add(entryPath)) {
                yield { type: 'match', path: entryPath, value: this.#withFileTypes ? entry : entryPath };
              }
            }
          } else if (nextMatches && entry.isDirectory()) {
            // Pattern matched, meaning two patterns forward
            // are also potential patterns
            // e.g **/b/c when entry is a/b - add c to potential patterns
            subPatterns.add(index + 2);
          }
          if ((nextMatches || pattern.at(0) === '.') &&
           (entry.isDirectory() || entry.isSymbolicLink()) && !fromSymlink) {
            // If pattern after ** matches, or pattern starts with "."
            // and entry is a directory or symlink, add to potential patterns
            subPatterns.add(nextIndex);
          }

          if (entry.isSymbolicLink()) {
            nSymlinks.add(index);
          }

          if (next === '..' && entry.isDirectory()) {
            // In case pattern is "**/..",
            // both parent and current directory should be added to the queue
            // if this is the last pattern, add to results instead
            const parent = join(path, '..');
            if (nextIndex < last) {
              if (!this.#subpatterns.has(path) && !this.#cache.seen(path, pattern, nextIndex + 1)) {
                this.#subpatterns.set(path, [pattern.child(new SetConstructor().add(nextIndex + 1))]);
              }
              if (!this.#subpatterns.has(parent) && !this.#cache.seen(parent, pattern, nextIndex + 1)) {
                this.#subpatterns.set(parent, [pattern.child(new SetConstructor().add(nextIndex + 1))]);
              }
            } else {
              if (!this.#cache.seen(path, pattern, nextIndex)) {
                this.#cache.add(path, pattern.child(new SetConstructor().add(nextIndex)));
                if (!this.#results.has(path)) {
                  if (this.#results.add(path)) {
                    yield { type: 'match', path, value: this.#withFileTypes ? (yield* this.#cache.stat(fullpath)) : path };
                  }
                }
              }
              if (!this.#cache.seen(path, pattern, nextIndex) || !this.#cache.seen(parent, pattern, nextIndex)) {
                this.#cache.add(parent, pattern.child(new SetConstructor().add(nextIndex)));
                if (!this.#results.has(parent)) {
                  if (this.#results.add(parent)) {
                    yield { type: 'match', path: parent, value: this.#withFileTypes ? (yield* this.#cache.stat(join(this.#root, parent))) : parent };
                  }
                }
              }
            }
          }
        }
        if (typeof current === 'string') {
          if (pattern.test(index, entry.name) && index !== last) {
            // If current pattern matches entry name
            // the next pattern is a potential pattern
            subPatterns.add(nextIndex);
          } else if (current === '.' && pattern.test(nextIndex, entry.name)) {
            // If current pattern is ".", proceed to test next pattern
            if (nextIndex === last) {
              if (!this.#results.has(entryPath)) {
                if (this.#results.add(entryPath)) {
                  yield { type: 'match', path: entryPath, value: this.#withFileTypes ? entry : entryPath };
                }
              }
            } else {
              subPatterns.add(nextIndex + 1);
            }
          }
        }
        if (typeof current === 'object' && pattern.test(index, entry.name)) {
          // If current pattern is a regex that matches entry name (e.g *.js)
          // add next pattern to potential patterns, or to results if it's the last pattern
          if (index === last) {
            if (!this.#results.has(entryPath)) {
              if (this.#results.add(entryPath)) {
                yield { type: 'match', path: entryPath, value: this.#withFileTypes ? entry : entryPath };
              }
            }
          } else if (entry.isDirectory()) {
            subPatterns.add(nextIndex);
          }
        }
      }
      if (subPatterns.size > 0) {
        // If there are potential patterns, add to queue
        this.#addSubpattern(entryPath, pattern.child(subPatterns, nSymlinks));
      }
    }
  }
}

export { Glob };
