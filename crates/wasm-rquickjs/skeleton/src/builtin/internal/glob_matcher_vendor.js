// Vendored minimatch 11.0.4 and its pinned dependency closure.
// See glob.NOTICES for complete licenses, integrity/provenance and local adaptations.
const balanced = (a, b, str) => {
    const ma = a instanceof RegExp ? maybeMatch(a, str) : a;
    const mb = b instanceof RegExp ? maybeMatch(b, str) : b;
    const r = ma !== null && mb != null && range(ma, mb, str);
    return (r && {
        start: r[0],
        end: r[1],
        pre: str.slice(0, r[0]),
        body: str.slice(r[0] + ma.length, r[1]),
        post: str.slice(r[1] + mb.length),
    });
};
const maybeMatch = (reg, str) => {
    const m = str.match(reg);
    return m ? m[0] : null;
};
const range = (a, b, str) => {
    let begs, beg, left, right = undefined, result;
    let ai = str.indexOf(a);
    let bi = str.indexOf(b, ai + 1);
    let i = ai;
    if (ai >= 0 && bi > 0) {
        if (a === b) {
            return [ai, bi];
        }
        begs = [];
        left = str.length;
        while (i >= 0 && !result) {
            if (i === ai) {
                begs.push(i);
                ai = str.indexOf(a, i + 1);
            }
            else if (begs.length === 1) {
                const r = begs.pop();
                if (r !== undefined)
                    result = [r, bi];
            }
            else {
                beg = begs.pop();
                if (beg !== undefined && beg < left) {
                    left = beg;
                    right = bi;
                }
                bi = str.indexOf(b, i + 1);
            }
            i = ai < bi && ai >= 0 ? ai : bi;
        }
        if (begs.length && right !== undefined) {
            result = [left, right];
        }
    }
    return result;
};

const escSlash = '\0SLASH' + Math.random() + '\0';
const escOpen = '\0OPEN' + Math.random() + '\0';
const escClose = '\0CLOSE' + Math.random() + '\0';
const escComma = '\0COMMA' + Math.random() + '\0';
const escPeriod = '\0PERIOD' + Math.random() + '\0';
const escSlashPattern = new RegExp(escSlash, 'g');
const escOpenPattern = new RegExp(escOpen, 'g');
const escClosePattern = new RegExp(escClose, 'g');
const escCommaPattern = new RegExp(escComma, 'g');
const escPeriodPattern = new RegExp(escPeriod, 'g');
const slashPattern = /\\\\/g;
const openPattern = /\\{/g;
const closePattern = /\\}/g;
const commaPattern = /\\,/g;
const periodPattern = /\\\./g;
const EXPANSION_MAX = 100_000;
// `EXPANSION_MAX` caps the *number* of expansions, but not their length. An
// input like `'{a,b}'.repeat(1500)` stays under that count - its output is
// truncated to 100k results - while making every result ~1500 characters
// long. The result set, and the intermediate arrays built while combining
// brace sets, then grow large enough to exhaust memory and crash the process
// (CVE-2026-14257). `EXPANSION_MAX_LENGTH` bounds the total number of
// characters the accumulator may hold at any point, so memory stays flat no
// matter how many brace groups are chained. The limit sits well above any
// realistic expansion (100k results hitting `EXPANSION_MAX` measure ~1M
// characters) so legitimate input is unaffected.
const EXPANSION_MAX_LENGTH = 4_000_000;
// `expand_` recurses once per level of brace *nesting* - both when expanding a
// set's comma members and when re-wrapping a set whose body is a single part.
// The CVE-2026-14257 fix made the *tail* iterative (recursion on `m.post`, one
// level per chained group), which left nesting depth unbounded: about 3,100
// levels of `{{{...a,b...}}}` - only ~6KB of input - exhausted the native stack
// and crashed the process. `EXPANSION_MAX_DEPTH` bounds how deep the parser
// will follow nesting. It sits far above any realistic pattern and well below
// the depth at which the stack runs out.
const EXPANSION_MAX_DEPTH = 1_000;
// Bash keeps a quirk where a brace group followed by a comma set still expands
// (`{a},b}`). The parser implements it by rewriting the string and restarting
// the scan, absorbing one `}` per pass. `n` trailing braces therefore cost `n`
// full passes over a string that itself grows by one `escClose` sentinel each
// time - quadratic in `n`, with a ~26x constant from the sentinel's length.
// 128KB of `'{a}' + '}'.repeat(n) + ',z}'` blocked the event loop for 27
// seconds to produce two results. `EXPANSION_MAX_REWRITES` bounds how many
// times the scan may restart. Real `{a},b}` input needs a handful.
const EXPANSION_MAX_REWRITES = 1_000;
function numeric(str) {
    return !isNaN(str) ? parseInt(str, 10) : str.charCodeAt(0);
}
function escapeBraces(str) {
    return str
        .replace(slashPattern, escSlash)
        .replace(openPattern, escOpen)
        .replace(closePattern, escClose)
        .replace(commaPattern, escComma)
        .replace(periodPattern, escPeriod);
}
function unescapeBraces(str) {
    return str
        .replace(escSlashPattern, '\\')
        .replace(escOpenPattern, '{')
        .replace(escClosePattern, '}')
        .replace(escCommaPattern, ',')
        .replace(escPeriodPattern, '.');
}
// Like `target.push(...items)` but doesn't overflow the stack
function pushAll(target, items) {
    for (let i = 0; i < items.length; i++) {
        target.push(items[i]);
    }
}
/**
 * Basically just str.split(","), but handling cases
 * where we have nested braced sections, which should be
 * treated as individual members, like {a,{b,c},d}
 */
function parseCommaParts(str) {
    const parts = [];
    // Walk the brace groups iteratively. Recursing on `post` once per group let a
    // chain of them exhaust the stack - the parsing-side counterpart to
    // the `expand_` overflow fixed for CVE-2026-14257, and not something `max` or
    // `maxLength` can bound, since it happens before expansion.
    //
    // The part the next chunk continues
    let carry = '';
    for (;;) {
        const m = balanced('{', '}', str);
        if (!m) {
            const tail = str.split(',');
            tail[0] = carry + tail[0];
            pushAll(parts, tail);
            return parts;
        }
        const { pre, body, post } = m;
        const p = pre.split(',');
        p[0] = carry + p[0];
        p[p.length - 1] += '{' + body + '}';
        if (!post.length) {
            pushAll(parts, p);
            return parts;
        }
        carry = p.pop();
        pushAll(parts, p);
        str = post;
    }
}
function expand(str, options = {}) {
    if (!str) {
        return [];
    }
    const { max = EXPANSION_MAX, maxLength = EXPANSION_MAX_LENGTH, maxDepth = EXPANSION_MAX_DEPTH, maxRewrites = EXPANSION_MAX_REWRITES, } = options;
    // I don't know why Bash 4.3 does this, but it does.
    // Anything starting with {} will have the first two bytes preserved
    // but *only* at the top level, so {},a}b will not expand to anything,
    // but a{},b}c will be expanded to [a}c,abc].
    // One could argue that this is a bug in Bash, but since the goal of
    // this module is to match Bash's rules, we escape a leading {}
    if (str.slice(0, 2) === '{}') {
        str = '\\{\\}' + str.slice(2);
    }
    return expand_(escapeBraces(str), max, maxLength, maxDepth, 0, maxRewrites, true).map(unescapeBraces);
}
function embrace(str) {
    return '{' + str + '}';
}
function isPadded(el) {
    return /^-?0\d/.test(el);
}
function lte(i, y) {
    return i <= y;
}
function gte(i, y) {
    return i >= y;
}
// Build `{ acc[a] + pre + values[v] }` for every combination, capping the
// number of results at `max` and the total number of characters at `maxLength`.
// This is the one place output grows, so bounding it here keeps the single
// accumulator - and therefore memory - flat regardless of how many brace groups
// are combined (CVE-2026-14257).
function combine(acc, pre, values, max, maxLength, dropEmpties) {
    const out = [];
    let length = 0;
    for (let a = 0; a < acc.length; a++) {
        for (let v = 0; v < values.length; v++) {
            if (out.length >= max)
                return out;
            const expansion = acc[a] + pre + values[v];
            // Bash drops empty results at the top level. Skip them before they count
            // against `max`, so `max` bounds the number of *kept* results.
            if (dropEmpties && !expansion)
                continue;
            if (length + expansion.length > maxLength)
                return out;
            out.push(expansion);
            length += expansion.length;
        }
    }
    return out;
}
// The expansion values of a single numeric (`1..5`) or alphabetic (`a..e..2`)
// sequence body.
function expandSequence(body, isAlphaSequence, max, maxLength) {
    const n = body.split(/\.\./);
    const N = [];
    // A sequence body always splits into two or three parts, but the compiler
    // can't know that.
    /* c8 ignore start */
    if (n[0] === undefined || n[1] === undefined) {
        return N;
    }
    /* c8 ignore stop */
    const x = numeric(n[0]);
    const y = numeric(n[1]);
    const width = Math.max(n[0].length, n[1].length);
    let incr = n.length === 3 && n[2] !== undefined ?
        Math.max(Math.abs(numeric(n[2])), 1)
        : 1;
    let test = lte;
    const reverse = y < x;
    if (reverse) {
        incr *= -1;
        test = gte;
    }
    const pad = n.some(isPadded);
    let length = 0;
    for (let i = x; test(i, y) && N.length < max; i += incr) {
        let c;
        if (isAlphaSequence) {
            c = String.fromCharCode(i);
            if (c === '\\') {
                c = '';
            }
        }
        else {
            c = String(i);
            if (pad) {
                const need = width - c.length;
                if (need > 0) {
                    const z = new Array(need + 1).join('0');
                    if (i < 0) {
                        c = '-' + z + c.slice(1);
                    }
                    else {
                        c = z + c;
                    }
                }
            }
        }
        if (length + c.length > maxLength)
            break;
        N.push(c);
        length += c.length;
    }
    return N;
}
function expand_(str, max, maxLength, maxDepth, depth, maxRewrites, isTop) {
    // Too deeply nested to keep following: treat the rest as literal, the same
    // way a group that cannot expand is already handled. Truncating rather than
    // throwing keeps `expand` total, matching `max` and `maxLength`.
    if (depth > maxDepth) {
        return [str];
    }
    // Consume the string's top-level brace groups left to right, threading a
    // running set of combined prefixes (`acc`). Expanding the tail iteratively -
    // rather than recursing on `m.post` once per group - keeps the native stack
    // depth constant, so deeply chained input (`'{a,b}'.repeat(3000)`) can no
    // longer overflow the stack, and leaves a single accumulator whose size
    // `maxLength` bounds directly (CVE-2026-14257).
    let acc = [''];
    // Bash drops empty results, but only when the *first* top-level group is a
    // comma set - a sequence like `{a..\}` may legitimately yield ''. The drop
    // is on the final strings, so it is applied to whichever `combine` produces
    // them (the one with no brace set left in the tail).
    // How many times the `{a},b}` rewrite below has restarted the scan. Each pass
    // re-reads the whole string, so leaving this unbounded is quadratic.
    let rewrites = 0;
    let dropEmpties = false;
    let firstGroup = true;
    for (;;) {
        const m = balanced('{', '}', str);
        // No brace set left: the rest of the string is literal.
        if (!m) {
            return combine(acc, str, [''], max, maxLength, dropEmpties);
        }
        // no need to expand pre, since it is guaranteed to be free of brace-sets
        const pre = m.pre;
        if (/\$$/.test(pre)) {
            acc = combine(acc, pre + '{' + m.body + '}', [''], max, maxLength, dropEmpties && !m.post.length);
            firstGroup = false;
            if (!m.post.length)
                break;
            str = m.post;
            continue;
        }
        const isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
        const isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
        const isSequence = isNumericSequence || isAlphaSequence;
        const isOptions = m.body.indexOf(',') >= 0;
        if (!isSequence && !isOptions) {
            // {a},b}
            if (rewrites < maxRewrites && m.post.match(/,(?!,).*\}/)) {
                rewrites++;
                str = m.pre + '{' + m.body + escClose + m.post;
                isTop = true;
                continue;
            }
            // Nothing here expands, so the whole remaining string is literal.
            return combine(acc, pre + '{' + m.body + '}' + m.post, [''], max, maxLength, dropEmpties);
        }
        if (firstGroup) {
            dropEmpties = isTop && !isSequence;
            firstGroup = false;
        }
        let values;
        if (isSequence) {
            values = expandSequence(m.body, isAlphaSequence, max, maxLength);
        }
        else {
            let n = parseCommaParts(m.body);
            if (n.length === 1 && n[0] !== undefined) {
                // x{{a,b}}y ==> x{a}y x{b}y
                n = expand_(n[0], max, maxLength, maxDepth, depth + 1, maxRewrites, false).map(embrace);
                //XXX is this necessary? Can't seem to hit it in tests.
                /* c8 ignore start */
                if (n.length === 1) {
                    acc = combine(acc, pre + n[0], [''], max, maxLength, dropEmpties && !m.post.length);
                    if (!m.post.length)
                        break;
                    str = m.post;
                    continue;
                }
                /* c8 ignore stop */
            }
            // Values that `combine` is going to drop as empty produce no result, so
            // they must not count against `max` - otherwise `{a,,b}` with `max: 2`
            // would stop at `['a', '']` and yield one result instead of two. Skipping
            // them outright keeps `values` bounded while leaving `max` a bound on
            // *kept* results.
            let dropsEmpties = dropEmpties && !m.post.length && !pre;
            for (let d = 0; dropsEmpties && d < acc.length; d++) {
                if (acc[d]) {
                    dropsEmpties = false;
                }
            }
            values = [];
            let valuesLength = 0;
            outer: for (let j = 0; j < n.length; j++) {
                const expanded = expand_(n[j], max, maxLength, maxDepth, depth + 1, maxRewrites, false);
                for (let k = 0; k < expanded.length; k++) {
                    const v = expanded[k];
                    if (dropsEmpties && !v)
                        continue;
                    if (values.length >= max ||
                        valuesLength + v.length > maxLength) {
                        break outer;
                    }
                    values.push(v);
                    valuesLength += v.length;
                }
            }
        }
        acc = combine(acc, pre, values, max, maxLength, dropEmpties && !m.post.length);
        if (!m.post.length)
            break;
        str = m.post;
    }
    return acc;
}

// translate the various posix character classes into unicode properties
// this works across all unicode locales
// { <posix class>: [<translation>, negated]
const posixClasses = {
    '[:alnum:]': ['\\p{L}\\p{Nl}\\p{Nd}'],
    '[:alpha:]': ['\\p{L}\\p{Nl}'],
    '[:ascii:]': ['\\x' + '00-\\x' + '7f'],
    '[:blank:]': ['\\p{Zs}\\t'],
    '[:cntrl:]': ['\\p{Cc}'],
    '[:digit:]': ['\\p{Nd}'],
    '[:graph:]': ['\\p{Z}\\p{C}', true],
    '[:lower:]': ['\\p{Ll}'],
    '[:print:]': ['\\p{C}', true],
    '[:punct:]': ['\\p{P}\\p{S}'],
    '[:space:]': ['\\p{Z}\\t\\r\\n\\v\\f'],
    '[:upper:]': ['\\p{Lu}'],
    '[:word:]': ['\\p{L}\\p{Nl}\\p{Nd}\\p{Pc}'],
    '[:xdigit:]': ['A-Fa-f0-9'],
};
// only need to escape a few things inside of brace expressions
// escapes: [ \ ] -
const braceEscape = (s) => s.replace(/[[\]\\-]/g, '\\$&');
const noMatch = /$./;
// Takes a glob string at a posix brace expression. Returns a RegExp
// that tests one character, and the number of glob chars consumed.
// If the class is not closed, consumed is 0, and the `[` must be
// treated as a literal character.
// Out of order ranges are removed. If nothing is left, the RegExp
// is `/$./`, and the rest of the glob is consumed, so that the
// whole glob cannot match.
const parseClass = (glob, position, nocase = false, form) => {
    // normalize one class member, if it stays one code point
    const norm = (c) => {
        const n = form ? c.normalize(form) : c;
        return [...n].length === 1 ? n : c;
    };
    const pos = position;
    /* c8 ignore start */
    if (glob.charAt(pos) !== '[') {
        throw new Error('not in a brace expression');
    }
    /* c8 ignore stop */
    const ranges = [];
    const negs = [];
    let i = pos + 1;
    let sawStart = false;
    let escaping = false;
    let negate = false;
    let endPos = pos;
    let rangeStart = '';
    WHILE: while (i < glob.length) {
        const c = String.fromCodePoint(glob.codePointAt(i));
        if ((c === '!' || c === '^') && i === pos + 1) {
            negate = true;
            i++;
            continue;
        }
        if (c === ']' && sawStart && !escaping) {
            endPos = i + 1;
            break;
        }
        sawStart = true;
        if (c === '\\') {
            if (!escaping) {
                escaping = true;
                i++;
                continue;
            }
            // escaped \ char, fall through and treat like normal char
        }
        if (c === '[' && !escaping) {
            // either a posix class, a collation equivalent, or just a [
            for (const [cls, [unip, neg]] of Object.entries(posixClasses)) {
                if (glob.startsWith(cls, i)) {
                    // invalid, [a-[] is fine, but not [a-[:alpha]]
                    if (rangeStart) {
                        return [noMatch, glob.length - pos];
                    }
                    i += cls.length;
                    if (neg)
                        negs.push(unip);
                    else
                        ranges.push(unip);
                    continue WHILE;
                }
            }
        }
        // now it's just a normal character, effectively
        escaping = false;
        const n = norm(c);
        if (rangeStart) {
            // throw this range away if it's not valid, but others
            // can still match.
            if (n.codePointAt(0) > rangeStart.codePointAt(0)) {
                ranges.push(braceEscape(rangeStart) + '-' + braceEscape(n));
            }
            else if (n === rangeStart) {
                ranges.push(braceEscape(n));
            }
            rangeStart = '';
            i += c.length;
            continue;
        }
        // now might be the start of a range.
        // can be either c-d or c-] or c<more...>] or c] at this point
        if (glob.startsWith('-]', i + c.length)) {
            ranges.push(braceEscape(n + '-'));
            i += c.length + 1;
            continue;
        }
        if (glob.startsWith('-', i + c.length)) {
            rangeStart = n;
            i += c.length + 1;
            continue;
        }
        // not the start of a range, just a single character
        ranges.push(braceEscape(n));
        i += c.length;
    }
    if (endPos < i) {
        // didn't see the end of the class, not a valid class,
        // but might still be valid as a literal match.
        return [noMatch, 0];
    }
    // if we got no ranges and no negates, then we have a range that
    // cannot possibly match anything, and that poisons the whole glob
    if (!ranges.length && !negs.length) {
        return [noMatch, glob.length - pos];
    }
    const sranges = '[' + (negate ? '^' : '') + ranges.join('') + ']';
    const snegs = '[' + (negate ? '' : '^') + negs.join('') + ']';
    const comb = '^' +
        (ranges.length && negs.length ? '(' + sranges + '|' + snegs + ')'
            : ranges.length ? sranges
                : snegs);
    return [new RegExp(comb, nocase ? 'iu' : 'u'), endPos - pos];
};

// the end of the pattern, or of a negated sub-pattern
const MATCH = { t: 'match', id: 0 };
const extTypes = '!?+*@';
const lit = (ch) => ({ t: 'lit', ch });
const reEscape = (s) => s.replace(/[\\^$.*+?()[\]{}|/]/g, '\\$&');
// a RegExp that only matches `s`, with unicode case folding
const newFoldRe = (s) => new RegExp(`^${reEscape(s)}$`, 'iu');
// foldRe for one literal char. The same chars are in most patterns,
// so keep them. A RegExp without the `g` or `y` flag has no state to
// share.
const foldCache = new Map();
const foldRe = (ch) => {
    let re = foldCache.get(ch);
    if (!re) {
        re = newFoldRe(ch);
        if (foldCache.size >= 1000)
            foldCache.clear();
        foldCache.set(ch, re);
    }
    return re;
};
const litMatch = (l, c) => {
    if (c === l.ch)
        return true;
    if (!l.re)
        return false;
    const code = c.charCodeAt(0);
    if (code >= 128)
        return l.re.test(c);
    const ascii = (l.ascii ??= new Uint8Array(128));
    ascii[code] ||= l.re.test(c) ? 1 : 2;
    return ascii[code] === 1;
};
const tokenize = (p, nocase, noext, form) => {
    const toks = [];
    for (let i = 0; i < p.length;) {
        const c = String.fromCodePoint(p.codePointAt(i));
        if (c === '\\') {
            // a trailing \ is a literal \
            const e = p.codePointAt(i + 1);
            const ch = e === undefined ? c : String.fromCodePoint(e);
            toks.push(lit(ch));
            i += 1 + ch.length;
            continue;
        }
        if (c === '[') {
            const [re, consumed] = parseClass(p, i, nocase, form);
            if (consumed) {
                toks.push({ t: 'class', re });
                i += consumed;
                continue;
            }
        }
        if (!noext && extTypes.includes(c) && p[i + 1] === '(') {
            toks.push({ t: 'open', type: c });
            i += 2;
            continue;
        }
        toks.push(!noext && c === '|' ? { t: 'bar' }
            : !noext && c === ')' ? { t: 'close' }
                : c === '*' ? { t: 'star' }
                    : c === '?' ? { t: 'any' }
                        : lit(c));
        i += c.length;
    }
    return toks;
};
// map each open token index to the index of its close token
const pair = (toks) => {
    const pairs = new Map();
    const stack = [];
    toks.forEach((tok, i) => {
        if (tok.t === 'open')
            stack.push(i);
        else if (tok.t === 'close' && stack.length)
            pairs.set(stack.pop(), i);
    });
    return pairs;
};
// build the alternatives between start and end. An open token that
// is not closed is never inside a closed extglob, so bar and close
// tokens are only literal at the top level.
const build = (toks, pairs, start, end, top) => {
    let seq = [];
    const alts = [seq];
    for (let i = start; i < end; i++) {
        const tok = toks[i];
        const close = pairs.get(i);
        if (tok.t === 'open' && close !== undefined) {
            const sub = build(toks, pairs, i + 1, close, false);
            seq.push({ t: 'ext', type: tok.type, alts: sub });
            i = close;
        }
        else if (tok.t === 'bar' && !top) {
            alts.push((seq = []));
        }
        else if (tok.t === 'open') {
            seq.push(lit(tok.type), lit('('));
        }
        else if (tok.t === 'bar') {
            seq.push(lit('|'));
        }
        else if (tok.t === 'close') {
            seq.push(lit(')'));
        }
        else {
            seq.push(tok);
        }
    }
    return alts;
};
// normalize each run of literal chars as one string, so that a char
// and the combining marks after it compose (or decompose) together.
// Syntax is already parsed, so a char that normalizes to a syntax
// char (such as full-width `＊` in NFKC) stays a literal.
const normalize = (items, form) => {
    const out = [];
    let run = '';
    const flush = () => {
        for (const ch of run.normalize(form))
            out.push(lit(ch));
        run = '';
    };
    for (const it of items) {
        if (it.t === 'lit') {
            run += it.ch;
            continue;
        }
        flush();
        out.push(it.t === 'ext' ?
            { ...it, alts: it.alts.map(a => normalize(a, form)) }
            : it);
    }
    flush();
    return out;
};
// the start node, and the number of node ids. Ids are dense, from 0
// for the match node.
const compile = (items, nocase) => {
    let id = 1;
    const split = (out) => ({ t: 'split', id: id++, out });
    const seq = (items, next) => items.reduceRight((next, it) => item(it, next), next);
    const item = (it, next) => {
        switch (it.t) {
            case 'lit':
                const re = nocase ? foldRe(it.ch) : undefined;
                return { t: 'lit', id: id++, ch: it.ch, re, next };
            case 'any':
            case 'star':
                return { t: it.t, id: id++, next };
            case 'class':
                return { t: 'class', id: id++, re: it.re, next };
        }
        const alts = (next) => it.alts.map(a => seq(a, next));
        switch (it.type) {
            case '@':
                return split(alts(next));
            case '?':
                return split([next, ...alts(next)]);
            case '!':
                return { t: 'neg', id: id++, sub: split(alts(MATCH)), next };
        }
        // * and +, loop back after each match
        const after = split([]);
        const entry = split(alts(after));
        after.out.push(next, entry);
        return it.type === '*' ? after : entry;
    };
    const start = seq(items, MATCH);
    return [start, id];
};
// one line per node, in the order that a walk from the start
// reaches them. Edges point to node ids. The nodes of a negated
// sub-pattern are indented under their negation.
const show = (start) => {
    const lines = [];
    const seen = new Set();
    const ref = (n) => (n.t === 'match' ? 'match' : String(n.id));
    const walk = (n, indent) => {
        if (n.t === 'match' || seen.has(n))
            return;
        seen.add(n);
        const line = (desc) => lines.push(`${indent}${n.id}: ${desc}`);
        switch (n.t) {
            case 'split':
                line(`split -> ${n.out.map(ref).join(', ')}`);
                for (const o of n.out)
                    walk(o, indent);
                return;
            case 'neg':
                line(`!(${ref(n.sub)}) -> ${ref(n.next)}`);
                walk(n.sub, indent + '  ');
                return walk(n.next, indent);
            case 'lit':
                line(`${JSON.stringify(n.ch)} -> ${ref(n.next)}`);
                break;
            case 'class':
                line(`${n.re} -> ${ref(n.next)}`);
                break;
            default:
                line(`${n.t === 'any' ? '?' : '*'} -> ${ref(n.next)}`);
        }
        walk(n.next, indent);
    };
    walk(start, '');
    return [`start -> ${ref(start)}`, ...lines].join('\n');
};
// The threads at one position in the string. Each node thread is
// only kept once, and runs with the same state are only kept once,
// so that identical threads merge. The match node is not in
// `threads`, because it can not step. It sets `match` instead.
class State {
    // set by the Sim, to mark the nodes that this state has
    gen;
    threads = [];
    match = false;
    runs = [];
    // the sorted ids of the threads, with 0 for a match, once the
    // state is done
    ids = [];
    constructor(gen) {
        this.gen = gen;
    }
    // no threads, so nothing more can match
    get dead() {
        return !this.threads.length && !this.match && !this.runs.length;
    }
}
// true if the two states hold the same threads
const sameState = (a, b) => {
    if (a.ids.length !== b.ids.length)
        return false;
    if (a.runs.length !== b.runs.length)
        return false;
    if (a.ids.some((id, i) => id !== b.ids[i]))
        return false;
    return a.runs.every(r => b.runs.some(o => o.neg === r.neg && sameState(o.state, r.state)));
};
const marks = (size) => ({
    has: new Float64Array(size),
    seen: new Float64Array(size),
    gen: 0,
});
class Sim {
    // `.` and `..` only match literal dots, even with `dot:true`
    dots;
    // the string starts with `.`, and `dot:true` is not set
    dotStart;
    #marks;
    constructor(dots, dotStart, marks) {
        this.dots = dots;
        this.dotStart = dotStart;
        this.#marks = marks;
    }
    state() {
        return new State(++this.#marks.gen);
    }
    // sort the ids of a state, once it has all of its threads
    done(state) {
        state.ids = state.threads.map(n => n.id).sort((a, b) => a - b);
        if (state.match)
            state.ids.unshift(MATCH.id);
        return state;
    }
    // true the first time that the state walks through the node, so
    // that loops in the graph stop
    #visit(state, node) {
        const { seen } = this.#marks;
        if (seen[node.id] === state.gen)
            return false;
        seen[node.id] = state.gen;
        return true;
    }
    #addThread(state, node) {
        const { has } = this.#marks;
        if (has[node.id] === state.gen)
            return false;
        has[node.id] = state.gen;
        state.threads.push(node);
        return true;
    }
    // wildcards only match a leading dot if `dot:true`. In a negated
    // sub-pattern, this does not apply, because the negation itself
    // can not match a leading dot.
    restricted(i, top) {
        return top && (this.dots || (this.dotStart && i === 0));
    }
    add(state, node, i, top) {
        switch (node.t) {
            case 'split':
                if (!this.#visit(state, node))
                    return;
                for (const o of node.out)
                    this.add(state, o, i, top);
                return;
            case 'neg':
                if (!this.#visit(state, node))
                    return;
                const sub = this.state();
                this.add(sub, node.sub, i, false);
                this.done(sub);
                return this.addRun(state, { t: 'run', neg: node, state: sub }, i, top);
            case 'star':
                // a * can not start a dotfile, even if it matches nothing
                if (this.restricted(i, top))
                    return;
                if (this.#addThread(state, node))
                    this.add(state, node.next, i, top);
                return;
            case 'match':
                state.match = true;
                return;
            default:
                this.#addThread(state, node);
        }
    }
    addRun(state, run, i, top) {
        for (const r of state.runs) {
            if (r.neg === run.neg && sameState(r.state, run.state))
                return;
        }
        state.runs.push(run);
        if (!run.state.match) {
            this.add(state, run.neg.next, i, top);
        }
    }
    // the threads after char `c`, at index `i`
    step(state, c, i, top) {
        const next = this.state();
        for (const th of state.threads) {
            switch (th.t) {
                case 'lit':
                    if (litMatch(th, c)) {
                        this.add(next, th.next, i + 1, top);
                    }
                    break;
                case 'any':
                    if (!this.restricted(i, top))
                        this.add(next, th.next, i + 1, top);
                    break;
                case 'class':
                    if (!this.restricted(i, top) && th.re.test(c)) {
                        this.add(next, th.next, i + 1, top);
                    }
                    break;
                case 'star':
                    if (!this.restricted(i, top))
                        this.add(next, th, i + 1, top);
            }
        }
        if (!this.restricted(i, top)) {
            for (const run of state.runs) {
                // a sub-pattern with no threads can not match again, so the
                // run stays the same
                if (run.state.dead) {
                    this.addRun(next, run, i + 1, top);
                    continue;
                }
                const sub = this.step(run.state, c, i, false);
                this.addRun(next, { t: 'run', neg: run.neg, state: sub }, i + 1, top);
            }
        }
        return this.done(next);
    }
}
// A canonical key for the threads in a state. States with the same
// key hold the same threads, so they match the same strings.
const stateKey = (state) => {
    const ids = state.ids.join();
    if (!state.runs.length)
        return ids;
    const runs = state.runs.map(r => `${r.neg.id}(${stateKey(r.state)})`);
    return `${ids}|${runs.sort().join('|')}`;
};
// The cache can hold about this many chars of state keys and
// transitions. When it is full, it is cleared, so that a pattern
// can not use an unbounded amount of memory.
const DFA_BUDGET = 1 << 18;
// A cache of the states that the simulation reaches, built as the
// matcher is used. Each char of a string is then one Map lookup,
// once the states that it leads to are known.
//
// The dot rules only restrict the first char of a dotfile (strings
// that are only `.` or `..` do not use the cache). So a dotfile
// starts at its own state, which takes its first step with the
// restriction, and every other state takes steps without it.
class Dfa {
    #start;
    #states = new Map();
    #size = 0;
    #plain;
    #dotStart;
    #sim;
    #dotSim;
    constructor(start, marks) {
        this.#start = start;
        this.#sim = new Sim(false, false, marks);
        this.#dotSim = new Sim(false, true, marks);
    }
    #make(state) {
        return {
            state,
            match: state.match,
            dead: state.dead,
            next: new Map(),
        };
    }
    #intern(state) {
        const key = stateKey(state);
        const found = this.#states.get(key);
        if (found)
            return found;
        if (this.#size > DFA_BUDGET)
            this.#clear();
        const d = this.#make(state);
        this.#states.set(key, d);
        this.#size += key.length + 1;
        return d;
    }
    #clear() {
        this.#states.clear();
        this.#size = 0;
        this.#plain = undefined;
        this.#dotStart = undefined;
    }
    start(dotStart) {
        if (dotStart) {
            if (this.#dotStart)
                return this.#dotStart;
            const state = this.#dotSim.state();
            this.#dotSim.add(state, this.#start, 0, true);
            return (this.#dotStart = this.#make(this.#dotSim.done(state)));
        }
        if (this.#plain)
            return this.#plain;
        const state = this.#sim.state();
        this.#sim.add(state, this.#start, 0, true);
        return (this.#plain = this.#intern(this.#sim.done(state)));
    }
    // the next state, after a miss in `d.ascii`
    next(d, c) {
        const code = c.charCodeAt(0);
        const found = code < 128 ? undefined : d.next.get(c);
        if (found)
            return found;
        // the dotfile start is not in the cache, so it is never shared
        const n = d === this.#dotStart ?
            this.#intern(this.#dotSim.step(d.state, c, 0, true))
            : this.#intern(this.#sim.step(d.state, c, 1, true));
        if (code < 128) {
            if (!d.ascii) {
                d.ascii = new Array(128);
                this.#size += 128;
            }
            d.ascii[code] = n;
        }
        else {
            d.next.set(c, n);
        }
        this.#size++;
        return n;
    }
}
// the nodes in order, if the graph is a single chain
const linear = (start) => {
    const nodes = [];
    for (let n = start; n.t !== 'match'; n = n.next) {
        if (n.t === 'split' || n.t === 'neg')
            return undefined;
        nodes.push(n);
    }
    return nodes;
};
// Match a chain of nodes. Each node other than `*` matches exactly
// one char, so on a failure it is enough to go back to the last `*`
// and let it match one more char. This takes at most
// nodes.length * chars.length steps.
const testLinear = (nodes, chars, start, end) => {
    let ni = 0;
    let ci = start;
    let starNi = -1;
    let starCi = 0;
    while (ci < end) {
        const n = nodes[ni];
        if (n?.t === 'star') {
            starNi = ni++;
            starCi = ci;
            continue;
        }
        const c = chars[ci];
        if (n &&
            (n.t === 'any' ||
                (n.t === 'lit' && litMatch(n, c)) ||
                (n.t === 'class' && n.re.test(c)))) {
            ni++;
            ci++;
            continue;
        }
        if (starNi === -1)
            return false;
        ni = starNi + 1;
        ci = ++starCi;
    }
    while (nodes[ni]?.t === 'star')
        ni++;
    return ni === nodes.length;
};
// The least and most chars that the items can match. These are only
// bounds: a negation can match a string of any length, so it counts
// as 0 to Infinity.
const lengths = (items) => {
    let min = 0;
    let max = 0;
    for (const it of items) {
        const [lo, hi] = itemLengths(it);
        min += lo;
        max += hi;
    }
    return [min, max];
};
const itemLengths = (it) => {
    if (it.t === 'star')
        return [0, Infinity];
    if (it.t !== 'ext')
        return [1, 1];
    if (it.type === '!')
        return [0, Infinity];
    const alts = it.alts.map(lengths);
    const min = Math.min(...alts.map(a => a[0]));
    const max = Math.max(...alts.map(a => a[1]));
    // a loop of alternatives that only match the empty string is empty
    const loop = max === 0 ? 0 : Infinity;
    return (it.type === '@' ? [min, max]
        : it.type === '?' ? [0, max]
            : it.type === '*' ? [0, loop]
                : [min, loop]);
};
// true if the chars from `start` match the literals
const hasAffix = (lits, chars, start) => {
    for (let j = 0; j < lits.length; j++) {
        if (!litMatch(lits[j], chars[start + j]))
            return false;
    }
    return true;
};
// a `/`, or half of a surrogate pair
const slashOrSurrogate = /[/\ud800-\udfff]/;
const surrogate = /[\ud800-\udfff]/;
// a string can be indexed by code point, unless it has surrogate
// pairs
const codePoints = (s) => surrogate.test(s) ? [...s] : s;
const noSlash = (s) => {
    if (s.includes('/')) {
        throw new Error('can only match a single path portion, got: ' + s);
    }
};
class Matcher {
    pattern;
    options;
    #start;
    // the number of node ids
    #size;
    #marks;
    // the Sim for strings that are only `.` or `..`
    #dotsSim;
    // the string to compare, if the pattern has no magic. With
    // `nocase:true`, the RegExp that folds case is made when it is
    // first used.
    #literal;
    #literalFold = false;
    #literalRe;
    // the nodes between the prefix and suffix, if the graph is a
    // single chain
    #linear;
    // the linear nodes are only `*` and `?`, so the length bounds and
    // the prefix and suffix decide the match
    #wild = false;
    // the least and most chars that a match can have
    #min = 0;
    #max = Infinity;
    // the literals that a match must start and end with. Each one
    // matches exactly one char, and they are distinct items in the
    // pattern, so a string that does not have them can not match.
    #prefix = [];
    #suffix = [];
    // the prefix and suffix as strings, if they do not fold case
    #prefixStr;
    #suffixStr;
    // there is a prefix or suffix to check
    #affix = false;
    #dfa;
    #form;
    constructor(pattern, options = {}) {
        if (pattern.includes('/')) {
            throw new Error('can only match a single path portion, got pattern: ' + pattern);
        }
        this.pattern = pattern;
        this.options = options;
        const { nocase = false, noext = false, normalize: n } = options;
        this.#form = n === true ? 'NFC' : n || undefined;
        // a pattern that is only an empty extglob is a literal string,
        // except for `!()`, which matches any non-empty string
        const literal = /^[?*+@]\(\)$/.test(pattern);
        const toks = tokenize(pattern, nocase, noext || literal, this.#form);
        let [items] = build(toks, pair(toks), 0, toks.length, true);
        if (this.#form)
            items = normalize(items, this.#form);
        const [start, size] = compile(items, nocase);
        this.#start = start;
        this.#size = size;
        if (items.every(it => it.t === 'lit')) {
            this.#literal = items.map(it => it.ch).join('');
            this.#literalFold = nocase;
        }
        else {
            const lit = (it) => it.t !== 'lit' ? undefined
                : nocase ? { ch: it.ch, re: foldRe(it.ch) }
                    : { ch: it.ch };
            for (const it of items) {
                const l = lit(it);
                if (!l)
                    break;
                this.#prefix.push(l);
            }
            for (let j = items.length - 1; j >= 0; j--) {
                const l = lit(items[j]);
                if (!l)
                    break;
                this.#suffix.unshift(l);
            }
            this.#affix = !!(this.#prefix.length || this.#suffix.length);
            if (!nocase) {
                this.#prefixStr = this.#prefix.map(l => l.ch).join('');
                this.#suffixStr = this.#suffix.map(l => l.ch).join('');
            }
            this.#linear = linear(this.#start)?.slice(this.#prefix.length, -this.#suffix.length || undefined);
            this.#wild = !!this.#linear?.every(n => n.t === 'star' || n.t === 'any');
            const [min, max] = lengths(items);
            this.#min = min;
            this.#max = max;
        }
    }
    test(s) {
        // The `/` check uses the string as given, so with normalization it
        // is a separate step. Otherwise, one scan finds both a `/` and the
        // surrogate pairs that stop the string being indexed by code point.
        if (this.#form) {
            noSlash(s);
            return this.#test(s.normalize(this.#form));
        }
        if (slashOrSurrogate.test(s)) {
            noSlash(s);
            return this.#test(s, [...s]);
        }
        return this.#test(s, s);
    }
    /**
     * The same as {@link Matcher#test}, but the string is not checked
     * for `/` chars, so the result for a string that has one is not
     * defined. Only use it for a string that is known to be one path
     * portion, such as a part of a path that was split on `/`. It can
     * be faster, because some patterns do not need to look at each char
     * of the string.
     */
    testUnchecked(s) {
        return this.#test(this.#form ? s.normalize(this.#form) : s);
    }
    // Test a string that has no `/`. `chars` indexes it by code point.
    // If it is not given, it is only found if a step needs it.
    #test(s, chars) {
        if (this.#literal !== undefined) {
            return this.#literalFold ?
                (this.#literalRe ??= newFoldRe(this.#literal)).test(s)
                : s === this.#literal;
        }
        // the length check means that the prefix and suffix do not
        // overlap. Without the chars, the length in code points is from
        // half of the UTF-16 length (if each one is a surrogate pair) to
        // all of it, which is often enough to know.
        const min = this.#min;
        const max = this.#max;
        if (chars === undefined) {
            const most = s.length;
            const least = (most + 1) >> 1;
            if (most < min || least > max)
                return false;
            if (least < min || most > max)
                chars = codePoints(s);
        }
        if (chars !== undefined &&
            (chars.length < min || chars.length > max)) {
            return false;
        }
        const prefix = this.#prefix.length;
        if (this.#affix) {
            if (this.#prefixStr !== undefined && this.#suffixStr !== undefined) {
                if (!s.startsWith(this.#prefixStr) ||
                    !s.endsWith(this.#suffixStr)) {
                    return false;
                }
            }
            else {
                chars ??= codePoints(s);
                const end = chars.length - this.#suffix.length;
                if (!hasAffix(this.#prefix, chars, 0) ||
                    !hasAffix(this.#suffix, chars, end)) {
                    return false;
                }
            }
        }
        const dotStart = !this.options.dot && s.startsWith('.');
        if (this.#linear) {
            // `.` and `..` only match literal dots, even with `dot:true`
            if (s === '.' || s === '..')
                return false;
            // only a literal can match the leading dot. A `*` can not
            // start a dotfile, even if it matches nothing.
            if (dotStart && !prefix)
                return false;
            if (this.#wild)
                return true;
            chars ??= codePoints(s);
            const end = chars.length - this.#suffix.length;
            return testLinear(this.#linear, chars, prefix, end);
        }
        chars ??= codePoints(s);
        if (s === '.' || s === '..') {
            this.#marks ??= marks(this.#size);
            const sim = (this.#dotsSim ??= new Sim(true, false, this.#marks));
            const start = sim.state();
            sim.add(start, this.#start, 0, true);
            let state = sim.done(start);
            for (let i = 0; i < chars.length; i++) {
                state = sim.step(state, chars[i], i, true);
            }
            return state.match;
        }
        this.#marks ??= marks(this.#size);
        const dfa = (this.#dfa ??= new Dfa(this.#start, this.#marks));
        let d = dfa.start(dotStart);
        // read char codes from the string, so that a one-char string is
        // only made for a cache miss
        const str = chars === s;
        for (let i = 0; i < chars.length; i++) {
            if (d.dead)
                return false;
            const code = str ? s.charCodeAt(i) : chars[i].charCodeAt(0);
            d = d.ascii?.[code] ?? dfa.next(d, chars[i]);
        }
        return d.match;
    }
    /** a readable listing of the state machine */
    toString() {
        return show(this.#start);
    }
}

const MAX_PATTERN_LENGTH = 1024 * 64;
const assertValidPattern = (pattern) => {
    if (typeof pattern !== 'string') {
        throw new TypeError('invalid pattern');
    }
    if (pattern.length > MAX_PATTERN_LENGTH) {
        throw new TypeError('pattern is too long');
    }
};

/**
 * Escape all magic characters in a glob pattern.
 *
 * If the {@link MinimatchOptions.windowsPathsNoEscape}
 * option is used, then characters are escaped by wrapping in `[]`, because
 * a magic character wrapped in a character class can only be satisfied by
 * that exact character.  In this mode, `\` is _not_ escaped, because it is
 * not interpreted as a magic character, but instead as a path separator.
 *
 * If the {@link MinimatchOptions.magicalBraces} option is used,
 * then braces (`{` and `}`) will be escaped.
 */
const escape = (s, { windowsPathsNoEscape = false, magicalBraces = false, } = {}) => {
    // don't need to escape +@! because we escape the parens
    // that make those magic, and escaping ! as [!] isn't valid,
    // because [!]] is a valid glob class meaning not ']'.
    if (magicalBraces) {
        return windowsPathsNoEscape ?
            s.replace(/[?*()[\]{}]/g, '[$&]')
            : s.replace(/[?*()[\]\\{}]/g, '\\$&');
    }
    return windowsPathsNoEscape ?
        s.replace(/[?*()[\]]/g, '[$&]')
        : s.replace(/[?*()[\]\\]/g, '\\$&');
};

/**
 * Un-escape a string that has been escaped with {@link escape}.
 *
 * If the {@link MinimatchOptions.windowsPathsNoEscape} option is used, then
 * square-bracket escapes are removed, but not backslash escapes.
 *
 * For example, it will turn the string `'[*]'` into `*`, but it will not
 * turn `'\\*'` into `'*'`, because `\` is a path separator in
 * `windowsPathsNoEscape` mode.
 *
 * When `windowsPathsNoEscape` is not set, then both square-bracket escapes and
 * backslash escapes are removed.
 *
 * Slashes (and backslashes in `windowsPathsNoEscape` mode) cannot be escaped
 * or unescaped.
 *
 * When `magicalBraces` is not set, escapes of braces (`{` and `}`) will not be
 * unescaped.
 */
const unescape = (s, { windowsPathsNoEscape = false, magicalBraces = true, } = {}) => {
    if (magicalBraces) {
        return windowsPathsNoEscape ?
            s.replace(/\[([^/\\])\]/g, '$1')
            : s
                .replace(/((?!\\).|^)\[([^/\\])\]/g, '$1$2')
                .replace(/\\([^/])/g, '$1');
    }
    return windowsPathsNoEscape ?
        s.replace(/\[([^/\\{}])\]/g, '$1')
        : s
            .replace(/((?!\\).|^)\[([^/\\{}])\]/g, '$1$2')
            .replace(/\\([^/{}])/g, '$1');
};

const minimatch = (p, pattern, options = {}) => {
    assertValidPattern(pattern);
    // shortcut: comments match nothing.
    if (!options.nocomment && pattern.charAt(0) === '#') {
        return false;
    }
    return cachedMinimatch(pattern, options).match(p);
};
// The Minimatch objects that minimatch() used most recently. A Map
// keeps its keys in the order they were set, so the first key is the
// one used least recently.
const cache = new Map();
const cacheMax = 256;
const cachedMinimatch = (pattern, options) => {
    const key = pattern + '\0' + JSON.stringify(options);
    let mm = cache.get(key);
    if (mm) {
        cache.delete(key);
    }
    else {
        // a copy, so a later change to the options can not change it
        mm = new Minimatch(pattern, { ...options });
        if (cache.size >= cacheMax) {
            cache.delete(cache.keys().next().value);
        }
    }
    cache.set(key, mm);
    return mm;
};
/* c8 ignore start */
const defaultPlatform = 'posix';
const path = {
    posix: { sep: '/' },
};
/* c8 ignore stop */
const sep = path.posix.sep;
minimatch.sep = sep;
const GLOBSTAR = Symbol('globstar **');
minimatch.GLOBSTAR = GLOBSTAR;
const filter = (pattern, options = {}) => (p) => minimatch(p, pattern, options);
minimatch.filter = filter;
const ext = (a, b = {}) => Object.assign({}, a, b);
const defaults = (def) => {
    if (!def || typeof def !== 'object' || !Object.keys(def).length) {
        return minimatch;
    }
    const orig = minimatch;
    const m = (p, pattern, options = {}) => orig(p, pattern, ext(def, options));
    return Object.assign(m, {
        Minimatch: class Minimatch extends orig.Minimatch {
            constructor(pattern, options = {}) {
                super(pattern, ext(def, options));
            }
            static defaults(options) {
                return orig.defaults(ext(def, options)).Minimatch;
            }
        },
        unescape: (s, options = {}) => orig.unescape(s, ext(def, options)),
        escape: (s, options = {}) => orig.escape(s, ext(def, options)),
        filter: (pattern, options = {}) => orig.filter(pattern, ext(def, options)),
        defaults: (options) => orig.defaults(ext(def, options)),
        braceExpand: (pattern, options = {}) => orig.braceExpand(pattern, ext(def, options)),
        match: (list, pattern, options = {}) => orig.match(list, pattern, ext(def, options)),
        sep: orig.sep,
        GLOBSTAR: GLOBSTAR,
    });
};
minimatch.defaults = defaults;
// Brace expansion:
// a{b,c}d -> abd acd
// a{b,}c -> abc ac
// a{0..3}d -> a0d a1d a2d a3d
// a{b,c{d,e}f}g -> abg acdfg acefg
// a{b,c}d{e,f}g -> abdeg acdeg abdeg abdfg
//
// Invalid sets are not expanded.
// a{2..}b -> a{2..}b
// a{b}c -> a{b}c
const braceExpand = (pattern, options = {}) => {
    assertValidPattern(pattern);
    // Thanks to Yeting Li <https://github.com/yetingli> for
    // improving this regexp to avoid a ReDOS vulnerability.
    if (options.nobrace || !/\{(?:(?!\{).)*\}/.test(pattern)) {
        // shortcut. no need to expand.
        return [pattern];
    }
    return expand(pattern, { max: options.braceExpandMax });
};
minimatch.braceExpand = braceExpand;
const match = (list, pattern, options = {}) => {
    const mm = new Minimatch(pattern, options);
    list = list.filter(f => mm.match(f));
    if (mm.options.nonull && !list.length) {
        list.push(pattern);
    }
    return list;
};
minimatch.match = match;
const globMagic = /[?*]|[+@!]\(.*?\)|\[|\]/;
// Index of the `]` that closes the class that starts at `start`,
// or -1 if it is not closed. Posix classes such as `[:alpha:]` are
// not skipped, so this can find a `]` before the real end. That
// only makes a class look less like a literal.
const classEnd = (pattern, start) => {
    let i = start + 1;
    if (pattern.charAt(i) === '!' || pattern.charAt(i) === '^')
        i++;
    let sawStart = false;
    for (; i < pattern.length; i++) {
        const c = pattern.charAt(i);
        if (c === ']' && sawStart)
            return i;
        sawStart = true;
        if (c === '\\')
            i++;
    }
    return -1;
};
// If a path portion pattern has no magic, return the string it
// matches. Otherwise, return undefined. This can report magic for
// a pattern that is in fact literal (eg, `[]`), but never the
// reverse, so a string result is always safe to compare directly.
const literal = (pattern, noext) => {
    if (!noext && (pattern === '+()' || pattern === '@()'))
        return pattern;
    let lit = '';
    for (let i = 0; i < pattern.length; i++) {
        const c = pattern.charAt(i);
        if (c === '\\') {
            // a trailing \ is a literal \
            lit += pattern.charAt(++i) || c;
        }
        else if (c === '*' || c === '?') {
            return undefined;
        }
        else if (c === '[') {
            const close = classEnd(pattern, i);
            if (close === -1) {
                // not closed, so the [ is a literal
                lit += c;
                continue;
            }
            // a class of one char, such as `[*]` or `[\b]`, is a literal
            let body = pattern.slice(i + 1, close);
            if (body.startsWith('\\'))
                body = body.slice(1);
            if ([...body].length !== 1 || '!^'.includes(pattern.charAt(i + 1))) {
                return undefined;
            }
            lit += body;
            i = close;
        }
        else if (!noext &&
            '+@!'.includes(c) &&
            pattern.charAt(i + 1) === '(' &&
            pattern.includes(')', i + 2)) {
            return undefined;
        }
        else {
            lit += c;
        }
    }
    return lit;
};
// True if the portion pattern has the same meaning as an alternative
// inside `@(...)`. It must not have a `|` or `)` that is not in a
// closed extglob (those are literal at the top level), an extglob
// that is not closed (the `)` of the `@(...)` would close it), or a
// trailing `\` (it would escape the next `|`). A pattern that is
// only an empty extglob, such as `?()`, is literal on its own, but
// not in `@(...)`. Posix classes such as `[:alpha:]` can hide a `]`
// from classEnd, so patterns with them are not merged.
const extSafe = (pattern) => {
    if (/^[?*+@]\(\)$/.test(pattern) || pattern.includes('[:'))
        return false;
    let depth = 0;
    for (let i = 0; i < pattern.length; i++) {
        const c = pattern.charAt(i);
        if (c === '\\') {
            if (++i === pattern.length)
                return false;
        }
        else if (c === '[') {
            const close = classEnd(pattern, i);
            if (close !== -1)
                i = close;
        }
        else if ('+@!?*'.includes(c) && pattern.charAt(i + 1) === '(') {
            depth++;
            i++;
        }
        else if (c === ')') {
            if (!depth--)
                return false;
        }
        else if (c === '|' && !depth) {
            return false;
        }
    }
    return !depth;
};
// The last path that Minimatch#match split, and its parts. A path is
// often tested against many patterns in a row (such as a list of
// ignore patterns), so this saves splitting it again. The parts are
// never changed, so they can be shared.
let lastSplit;
// The last path that Minimatch#match checked before splitting it. If
// the same path is checked again, it is being tested against many
// patterns, so it is split and the parts are kept for the others.
let lastChecked;
// true if a pattern portion that is not ** matches a path portion.
// An empty path portion only matches an empty pattern portion. A path
// portion never has a `/`, so the Matcher does not need to check it.
const portionMatch = (p, f) => typeof p === 'string' ? f === p : f !== '' && p.testUnchecked(f);
// Where the last portion of a row matches in a path: the start of the
// last portion of the path, or of the one before a trailing `/`. -1 if
// it matches neither.
const endIndex = (p, last, lastStart, prev, prevStart) => portionMatch(p, last) ? lastStart
    : prev !== undefined && portionMatch(p, prev) ? prevStart
        : -1;
const isDots = (p) => p === '.' || p === '..';
// a Windows drive letter portion, like `c:`
const isDrive = (p) => typeof p === 'string' && /^[a-z]:$/i.test(p);
// true for the `UNC` portion of a long UNC root, //?/UNC/host/share
const isLongUNC = (p) => typeof p === 'string' && /^unc$/i.test(p);
// The index of the host in a row or split path that starts with a
// Windows UNC root: 2 for `//host/share`, and 4 for
// `//?/UNC/host/share`. Otherwise -1. `//?/c:` is not one.
const uncHost = (p) => {
    if (p[0] !== '' || p[1] !== '')
        return -1;
    const h = p[2] !== '?' ? 2
        : isLongUNC(p[3]) ? 4
            : -1;
    const host = p[h];
    const share = p[h + 1];
    return (h !== -1 &&
        host !== undefined &&
        host !== '' &&
        host !== GLOBSTAR &&
        share !== undefined &&
        share !== '' &&
        share !== GLOBSTAR) ?
        h
        : -1;
};
// true if ** can walk the path portion: not `.` or `..`, and not a
// dotfile unless `dot` is set
const walkable = (p, dot) => !isDots(p) && (dot || !p.startsWith('.'));
// True if a portion of the path from `start` to `end` can not be
// walked by **: one that starts with `.`, or with `dot`, one that is
// `.` or `..`. `start` is the start of a portion, and `end` is the end
// of the path, or just after a separator.
const dotPortion = (f, start, end, dot, sep) => {
    for (let k = start; k < end;) {
        if (f.charCodeAt(k) === 46) {
            if (!dot)
                return true;
            const n = f.charCodeAt(k + 1) === 46 ? k + 2 : k + 1;
            if (n >= end || isSep(f.charCodeAt(n), sep))
                return true;
        }
        // the start of the next portion, after any run of separators
        const s = nextSep(f, k, sep);
        if (s === -1)
            return false;
        k = s + 1;
        while (k < end && isSep(f.charCodeAt(k), sep))
            k++;
    }
    return false;
};
const isSep = (c, sep) => sep === '/' ? c === 47
    : sep === '\\' ? c === 92
        : c === 47 || c === 92;
// the index of the first separator at or after `from`, or -1
const nextSep = (f, from, sep) => {
    if (sep !== 'both')
        return f.indexOf(sep, from);
    const s = f.indexOf('/', from);
    const b = f.indexOf('\\', from);
    return (s === -1 ? b
        : b === -1 ? s
            : Math.min(s, b));
};
// the index of the last separator at or before `from`, or -1
const lastSep = (f, from, sep) => sep !== 'both' ?
    f.lastIndexOf(sep, from)
    : Math.max(f.lastIndexOf('/', from), f.lastIndexOf('\\', from));
// What parse() returns in place of a Matcher while make() builds and
// merges the rows. Most of the Matchers in rows that are merged would
// never be used, so they are only made for the rows that are left.
const PENDING = {};
class Minimatch {
    options;
    set;
    pattern;
    windowsPathsNoEscape;
    nonegate;
    negate;
    comment;
    empty;
    preserveMultipleSlashes;
    partial;
    globSet;
    globParts;
    nocase;
    isWindows;
    platform;
    windowsNoMagicRoot;
    maxGlobstarRecursion;
    // the path can be checked against the last portion, and the string
    // portions, of each row before it is split. See #canMatch.
    #endCheck;
    #literalCheck;
    // level 2 resolves `.` and `..` portions in the path
    #level2;
    // the unicode normalization form, if any
    #form;
    // the string portions of each row in the set
    #literals = [];
    // the rows that #canMatch can match without splitting the path
    #shapes = [];
    // the rows whose last portion can be checked against the path's
    #endRows = [];
    // brace expansion can make the same portion in many rows, so they
    // share one Matcher, and the states that it caches
    #matchers = new Map();
    // parse() returns PENDING in place of a Matcher
    #pending = false;
    // the GlobstarParts of each pattern row, by start index and partial
    #globstarParts = new WeakMap();
    constructor(pattern, options = {}) {
        assertValidPattern(pattern);
        options = options || {};
        this.options = options;
        this.maxGlobstarRecursion = options.maxGlobstarRecursion ?? 200;
        this.pattern = pattern;
        this.platform = options.platform || defaultPlatform;
        this.isWindows = this.platform === 'win32';
        // avoid the annoying deprecation flag lol
        const awe = ('allowWindow' + 'sEscape');
        this.windowsPathsNoEscape =
            !!options.windowsPathsNoEscape || options[awe] === false;
        if (this.windowsPathsNoEscape) {
            this.pattern = this.pattern.replace(/\\/g, '/');
        }
        this.preserveMultipleSlashes = !!options.preserveMultipleSlashes;
        this.negate = false;
        this.nonegate = !!options.nonegate;
        this.comment = false;
        this.empty = false;
        this.partial = !!options.partial;
        this.nocase = !!this.options.nocase;
        this.windowsNoMagicRoot =
            options.windowsNoMagicRoot !== undefined ?
                options.windowsNoMagicRoot
                : !!(this.isWindows && this.nocase);
        this.globSet = [];
        this.globParts = [];
        this.set = [];
        this.#endCheck = !this.preserveMultipleSlashes;
        this.#level2 = (options.optimizationLevel ?? 1) >= 2;
        const n = options.normalize;
        this.#form = n === true ? 'NFC' : n || undefined;
        // make the set of Matchers etc.
        this.make();
        // On Windows, the portions of a row up to its drive letter or UNC
        // share are skipped or compared without case, if the path has one
        // too. So the checks only use the portions after it.
        const drives = this.set.map(row => this.#rootIndex(row));
        this.#endRows = this.set.map((row, r) => this.#endCheck && row.length - 1 > drives[r]);
        // with the end check, the last portion is already checked
        this.#literals = this.set.map((row, r) => {
            const end = this.#endRows[r] ? row.length - 1 : row.length;
            const lits = row
                .slice(drives[r] + 1, end)
                .filter((p) => typeof p === 'string' && !!p);
            return [...new Set(lits)];
        });
        this.#literalCheck = this.#literals.some(l => l.length);
        this.#shapes = this.set.map((row, r) => {
            const [p0, p1, p2] = row;
            if (this.#endRows[r] && row.length === 2) {
                if (p0 === GLOBSTAR && p1 !== GLOBSTAR)
                    return 'tail';
            }
            // the basename of a path that is split on / is its last portion,
            // or the one before a trailing /, the same as the end check
            if (this.#endRows[r] &&
                options.matchBase &&
                row.length === 1 &&
                p0 !== GLOBSTAR &&
                p0 !== '') {
                return 'base';
            }
            // the portion must not be a root, or '', which can be a
            // different portion on Windows (where //x paths get an extra '')
            if (!this.#endCheck || drives[r] !== -1)
                return undefined;
            if (row.length === 3 &&
                p0 === GLOBSTAR &&
                p2 === GLOBSTAR &&
                p1 !== GLOBSTAR &&
                p1 !== '' &&
                // the portion between is only matched below this limit
                this.maxGlobstarRecursion > 0) {
                return 'mid';
            }
            if (row.length === 2 &&
                p1 === GLOBSTAR &&
                p0 !== GLOBSTAR &&
                p0 !== '') {
                return 'head';
            }
            return undefined;
        });
    }
    // a string portion of a pattern, normalized if the option is set
    #norm(p) {
        return this.#form ? p.normalize(this.#form) : p;
    }
    // On Windows, the index of the last root portion of a row, as
    // #matchRow finds it: 0 for `c:/...`, 3 for `//?/c:/...` and
    // `//host/share/...`, and 5 for `//?/UNC/host/share/...`. Otherwise
    // -1.
    #rootIndex(row) {
        if (!this.isWindows)
            return -1;
        if (isDrive(row[0]))
            return 0;
        const uncDrive = row[0] === '' && row[1] === '' && row[2] === '?' && isDrive(row[3]);
        if (uncDrive)
            return 3;
        const h = uncHost(row);
        return h === -1 ? -1 : h + 1;
    }
    hasMagic() {
        if (this.options.magicalBraces && this.set.length > 1) {
            return true;
        }
        for (const pattern of this.set) {
            for (const part of pattern) {
                if (typeof part !== 'string')
                    return true;
            }
        }
        return false;
    }
    make() {
        const pattern = this.pattern;
        const options = this.options;
        // empty patterns and comments match nothing.
        if (!options.nocomment && pattern.charAt(0) === '#') {
            this.comment = true;
            return;
        }
        if (!pattern) {
            this.empty = true;
            return;
        }
        // step 1: figure out negation, etc.
        this.parseNegate();
        // step 2: expand braces
        this.globSet = [...new Set(this.braceExpand())];
        // step 3: now we have a set, so turn each one into a series of
        // path-portion matching patterns.
        // These will be Matchers, except in the case of "**", which is
        // set to the GLOBSTAR object for globstar behavior,
        // and will not contain any / characters
        //
        // First, we preprocess to make the glob pattern sets a bit simpler
        // and deduped.  There are some perf-killing patterns that can cause
        // problems with a glob walk, but we can simplify them down a bit.
        const rawGlobParts = this.globSet.map(s => this.#slashSplit(s));
        this.globParts = this.preprocess(rawGlobParts);
        // glob --> Matchers
        this.#pending = true;
        let set = this.globParts.map((s, _, __) => {
            if (this.isWindows && this.windowsNoMagicRoot) {
                // check if it's a drive or unc path. The root of a long UNC
                // path, //?/UNC/host/share, is 6 portions.
                const n = s[2] === '?' && isLongUNC(s[3]) ? 6 : 4;
                const isUNC = s[0] === '' &&
                    s[1] === '' &&
                    (s[2] === '?' || !globMagic.test(s[2])) &&
                    s.slice(3, n).every(p => !globMagic.test(p));
                const isDrive = /^[a-z]:/i.test(s[0]);
                if (isUNC) {
                    return [
                        ...s.slice(0, n).map(p => this.#norm(p)),
                        ...s.slice(n).map(ss => this.parse(ss)),
                    ];
                }
                else if (isDrive) {
                    return [
                        this.#norm(s[0]),
                        ...s.slice(1).map(ss => this.parse(ss)),
                    ];
                }
            }
            return s.map(ss => this.parse(ss));
        });
        // filter out everything that didn't compile properly.
        this.set = set.filter(s => s.indexOf(false) === -1);
        // do not treat the ? in UNC paths as magic
        if (this.isWindows) {
            for (let i = 0; i < this.set.length; i++) {
                const p = this.set[i];
                if (p[0] === '' &&
                    p[1] === '' &&
                    this.globParts[i][2] === '?' &&
                    (isDrive(p[3]) || isLongUNC(this.globParts[i][3]))) {
                    if (isLongUNC(this.globParts[i][3]))
                        p[3] = 'UNC';
                    p[2] = '?';
                }
            }
        }
        // with noext, `@(...)` would be literal
        if (!options.noext)
            this.mergeRows();
        this.#pending = false;
        this.set.forEach((row, i) => {
            for (let k = 0; k < row.length; k++) {
                if (row[k] === PENDING) {
                    row[k] = this.parse(this.globParts[i][k]);
                }
            }
        });
    }
    // Merge rows that only differ in one portion, where each of them
    // is a Matcher, into one row that matches any of them with
    // `@(a|b|...)`. Then a path is only walked once for all of them,
    // for example with `**/*.{js,ts}`.
    mergeRows() {
        let merged = true;
        while (merged) {
            merged = false;
            const len = Math.max(0, ...this.set.map(r => r.length));
            for (let k = 0; k < len; k++) {
                // the rows that are the same other than at portion k
                const groups = new Map();
                this.set.forEach((row, i) => {
                    if (!(row[k] instanceof Matcher || row[k] === PENDING) ||
                        !extSafe(this.globParts[i][k])) {
                        return;
                    }
                    const parts = [...this.globParts[i]];
                    parts[k] = '';
                    const key = `${row.length}/${parts.join('/')}`;
                    const g = groups.get(key);
                    if (g)
                        g.push(i);
                    else
                        groups.set(key, [i]);
                });
                const drop = new Set();
                for (const g of groups.values()) {
                    if (g.length < 2)
                        continue;
                    const [first, ...rest] = g;
                    const alts = g.map(i => this.globParts[i][k]);
                    const glob = `@(${alts.join('|')})`;
                    this.globParts[first][k] = glob;
                    this.set[first][k] = this.parse(glob);
                    for (const i of rest)
                        drop.add(i);
                }
                if (drop.size) {
                    merged = true;
                    this.set = this.set.filter((_, i) => !drop.has(i));
                    this.globParts = this.globParts.filter((_, i) => !drop.has(i));
                }
            }
        }
    }
    // various transforms to equivalent pattern sets that are
    // faster to process in a filesystem walk.  The goal is to
    // eliminate what we can, and push all ** patterns as far
    // to the right as possible, even if it increases the number
    // of patterns that we have to process.
    preprocess(globParts) {
        // if we're not in globstar mode, then turn ** into *
        if (this.options.noglobstar) {
            for (const partset of globParts) {
                for (let j = 0; j < partset.length; j++) {
                    if (partset[j] === '**') {
                        partset[j] = '*';
                    }
                }
            }
        }
        const { optimizationLevel = 1 } = this.options;
        if (optimizationLevel >= 2) {
            // aggressive optimization for the purpose of fs walking
            globParts = this.firstPhasePreProcess(globParts);
            globParts = this.secondPhasePreProcess(globParts);
        }
        else if (optimizationLevel >= 1) {
            // just basic optimizations to remove some .. parts
            globParts = this.levelOneOptimize(globParts);
        }
        else {
            // just collapse multiple ** portions into one
            globParts = this.adjascentGlobstarOptimize(globParts);
        }
        return globParts;
    }
    // just get rid of adjascent ** portions
    adjascentGlobstarOptimize(globParts) {
        return globParts.map(parts => {
            let gs = -1;
            while (-1 !== (gs = parts.indexOf('**', gs + 1))) {
                let i = gs;
                while (parts[i + 1] === '**') {
                    i++;
                }
                if (i !== gs) {
                    parts.splice(gs, i - gs);
                }
            }
            return parts;
        });
    }
    // get rid of adjascent ** and resolve .. portions
    levelOneOptimize(globParts) {
        return globParts.map(parts => {
            // .. can not remove the root of a Windows path
            const root = this.#rootIndex(parts) + 1;
            parts = parts.reduce((set, part) => {
                const prev = set[set.length - 1];
                if (part === '**' && prev === '**') {
                    return set;
                }
                if (part === '..') {
                    if (set.length > root &&
                        prev &&
                        prev !== '..' &&
                        prev !== '.' &&
                        prev !== '**') {
                        set.pop();
                        return set;
                    }
                }
                set.push(part);
                return set;
            }, []);
            return parts.length === 0 ? [''] : parts;
        });
    }
    // Check the path against each row before it is split. 'no' if no
    // row can match, so it does not need to be split. 'yes' if a row of
    // `**` and one more portion matches. 'maybe' if it must be split to
    // know. None of this applies with partial, where the path can end
    // before the row does.
    //
    // On Windows, `\` is a separator in the path too, and the portions of
    // a row up to its drive letter or UNC share are not checked (see
    // #rootIndex).
    //
    // Each string portion of a row must be a portion of the path, so the
    // path must contain it. Level 2 can only take portions out of the
    // path, so this is still true then.
    //
    // The last portion of a row must match the last portion of the path,
    // or the one before a trailing `/` (as a/* and a/**/* match a/b/).
    // This does not apply to rows that end in **, rows that end in a
    // root, or preserveMultipleSlashes (which can leave more
    // than one '' at the end). At level 2, it does not apply if that
    // portion is `.` or `..`, which can be
    // resolved away. Level 2 only takes other portions out of the
    // middle of the path.
    //
    // A row of `**/x` then matches if the ** can walk the portions
    // before the one that x matches, the same as #matchGlobstar. At
    // level 2, this is only known if none of them are `.` or `..`, so
    // that the path does not change when it is resolved.
    #canMatch(f) {
        const sep = !this.isWindows || !f.includes('\\') ? '/'
            : f.includes('/') ? 'both'
                : '\\';
        // the portions that f.split(/\/+/) would end with, and where they
        // start in f, found when a row needs them. `ends` is 0 until they
        // are found, then 1, or -1 if they can not be used.
        let ends = this.#endCheck ? 0 : -1;
        let last = '';
        let lastStart = 0;
        let prev;
        let prevStart = 0;
        const dot = !!this.options.dot;
        // A string compare is cheaper than includes(), and a Matcher test
        // costs more, so the cheaper check goes first.
        ROWS: for (let r = 0; r < this.set.length; r++) {
            const row = this.set[r];
            const p = row[row.length - 1];
            let end = ends !== -1 && this.#endRows[r] && p !== GLOBSTAR;
            if (end && ends === 0) {
                const i = lastSep(f, f.length, sep);
                lastStart = i + 1;
                last = f.slice(lastStart);
                if (last === '' && i >= 0) {
                    let j = i;
                    while (j > 0 && isSep(f.charCodeAt(j - 1), sep))
                        j--;
                    prevStart = j === 0 ? 0 : lastSep(f, j - 1, sep) + 1;
                    prev = f.slice(prevStart, j);
                }
                const resolves = this.#level2 &&
                    (isDots(last) ||
                        (last === '' && prev !== undefined && isDots(prev)));
                ends = resolves ? -1 : 1;
                end = !resolves;
            }
            let tailStart = -1;
            if (end && typeof p === 'string') {
                tailStart = endIndex(p, last, lastStart, prev, prevStart);
                if (tailStart === -1)
                    continue;
            }
            if (this.#literalCheck) {
                for (const l of this.#literals[r]) {
                    if (!f.includes(l))
                        continue ROWS;
                }
            }
            if (end && typeof p === 'object') {
                tailStart = endIndex(p, last, lastStart, prev, prevStart);
                if (tailStart === -1)
                    continue;
            }
            const shape = this.#shapes[r];
            if (shape === 'base' && end)
                return 'yes';
            if (shape === 'tail' && end) {
                if (this.#level2 && dotPortion(f, 0, tailStart, true, sep)) {
                    return 'maybe';
                }
                if (!dotPortion(f, 0, tailStart, dot, sep))
                    return 'yes';
                continue;
            }
            if (shape === 'mid' || shape === 'head') {
                const m = this.#walk(f, row, shape === 'head', dot, sep);
                if (m !== 'no')
                    return m;
                continue;
            }
            return 'maybe';
        }
        return 'no';
    }
    // Match a row of a known shape against the split path, the same as
    // #matchGlobstar and #matchGlobStarBodySections do. None of these
    // rows have a drive letter, so they start at the first portion.
    #matchShape(file, row, shape) {
        const dot = !!this.options.dot;
        const n = file.length;
        if (shape === 'head') {
            // x, then at least one portion that ** can walk
            if (n < 2 || !portionMatch(row[0], file[0])) {
                return false;
            }
            for (let i = 1; i < n; i++)
                if (!walkable(file[i], dot))
                    return false;
            return true;
        }
        const x = row[1];
        if (shape === 'tail') {
            // x is the last portion, or the one before a trailing ''
            let t = n - 1;
            if (!portionMatch(x, file[t])) {
                if (file[t] !== '' || n === 1 || !portionMatch(x, file[--t])) {
                    return false;
                }
            }
            for (let i = 0; i < t; i++)
                if (!walkable(file[i], dot))
                    return false;
            return true;
        }
        // mid: the first x that ** can walk to, with a portion after it,
        // and ** can walk all of those
        for (let k = 0; k < n; k++) {
            if (portionMatch(x, file[k]) && k + 1 < n) {
                let i = k + 1;
                while (i < n && walkable(file[i], dot))
                    i++;
                if (i === n)
                    return true;
            }
            if (!walkable(file[k], dot))
                return false;
        }
        return false;
    }
    // Match a row of `**/x/**` or `x/**` against the path, the same as
    // #matchGlobstar and #matchGlobStarBodySections do once it is split.
    // x must match a portion (the first one, for `x/**`), the ** before
    // it must be able to walk the portions before that one, and there
    // must be a portion after it, which the ** after it can walk. At
    // level 2, this is only known if no portion is `.` or `..`.
    #walk(f, row, head, dot, sep) {
        if (this.#level2 && dotPortion(f, 0, f.length, true, sep))
            return 'maybe';
        const x = row[head ? 0 : 1];
        // the last portion has none after it, so it can not be x
        let s = 0;
        for (let e = nextSep(f, s, sep); e !== -1; e = nextSep(f, s, sep)) {
            // the start of the next portion
            let next = e + 1;
            while (next < f.length && isSep(f.charCodeAt(next), sep))
                next++;
            const hit = typeof x === 'string' ?
                e - s === x.length && f.startsWith(x, s)
                : e > s && x.testUnchecked(f.slice(s, e));
            if (hit && !dotPortion(f, next, f.length, dot, sep))
                return 'yes';
            if (head || dotPortion(f, s, next, dot, sep))
                return 'no';
            s = next;
        }
        return 'no';
    }
    // the last split, if it was the same path with the same split
    // settings
    #cachedSplit(f) {
        const last = lastSplit;
        return (last?.f === f &&
            last.isWindows === this.isWindows &&
            last.preserveMultipleSlashes === this.preserveMultipleSlashes &&
            last.normalize === this.#form) ?
            last
            : undefined;
    }
    // split a path for match(), and keep the parts for the next call
    #split(f) {
        const { isWindows, preserveMultipleSlashes } = this;
        // windows: need to use /, not \
        let parts = this.#slashSplit(isWindows ? f.split('\\').join('/') : f);
        // normalize each portion, so that a char that normalizes to `/`
        // does not make a new portion
        const normalize = this.#form;
        if (normalize)
            parts = parts.map(p => p.normalize(normalize));
        lastSplit = {
            f,
            isWindows,
            preserveMultipleSlashes,
            normalize,
            parts,
        };
        return lastSplit;
    }
    // resolve `.` and `..` portions of a path, for level 2
    #levelTwoFileOptimize(file) {
        // work on a copy, so that the cached parts do not change
        const parts = [...file];
        let didSomething = false;
        do {
            didSomething = false;
            // <pre>/<e>/<rest> -> <pre>/<rest>
            if (!this.preserveMultipleSlashes) {
                for (let i = 1; i < parts.length - 1; i++) {
                    const p = parts[i];
                    // don't squeeze out UNC patterns
                    if (i === 1 && p === '' && parts[0] === '')
                        continue;
                    if (p === '.' || p === '') {
                        didSomething = true;
                        parts.splice(i, 1);
                        i--;
                    }
                }
                if (parts[0] === '.' &&
                    parts.length === 2 &&
                    (parts[1] === '.' || parts[1] === '')) {
                    didSomething = true;
                    parts.pop();
                }
            }
            // <pre>/<p>/../<rest> -> <pre>/<rest>
            // .. can not remove the root of a Windows path
            const root = this.#rootIndex(parts) + 1;
            let dd = root;
            while (-1 !== (dd = parts.indexOf('..', dd + 1))) {
                const p = parts[dd - 1];
                if (p && p !== '.' && p !== '..' && p !== '**') {
                    didSomething = true;
                    parts.splice(dd - 1, 2);
                    dd = Math.max(dd - 2, root);
                }
            }
        } while (didSomething);
        return parts.length === 0 ? [''] : parts;
    }
    // First phase: single-pattern processing
    // <pre> is 1 or more portions
    // <rest> is 1 or more portions
    // <p> is any portion other than ., .., '', or **
    // <e> is . or ''
    //
    // **/.. is *brutal* for filesystem walking performance, because
    // it effectively resets the recursive walk each time it occurs,
    // and ** cannot be reduced out by a .. pattern part like a regexp
    // or most strings (other than .., ., and '') can be.
    //
    // <pre>/**/../<p>/<p>/<rest> -> {<pre>/../<p>/<p>/<rest>,<pre>/**/<p>/<p>/<rest>}
    // <pre>/<e>/<rest> -> <pre>/<rest>
    // <pre>/<p>/../<rest> -> <pre>/<rest>
    // **/**/<rest> -> **/<rest>
    //
    // **/*/<rest> -> */**/<rest> <== not valid because ** doesn't follow
    // this WOULD be allowed if ** did follow symlinks, or * didn't
    firstPhasePreProcess(globParts) {
        // each **/.. split doubles the patterns, so stop at the brace max
        const { braceExpandMax = 100_000 } = this.options;
        let didSomething = false;
        do {
            didSomething = false;
            // <pre>/**/../<p>/<p>/<rest> -> {<pre>/../<p>/<p>/<rest>,<pre>/**/<p>/<p>/<rest>}
            for (let parts of globParts) {
                let gs = -1;
                while (-1 !== (gs = parts.indexOf('**', gs + 1))) {
                    let gss = gs;
                    while (parts[gss + 1] === '**') {
                        // <pre>/**/**/<rest> -> <pre>/**/<rest>
                        gss++;
                    }
                    // eg, if gs is 2 and gss is 4, that means we have 3 **
                    // parts, and can remove 2 of them.
                    if (gss > gs) {
                        parts.splice(gs + 1, gss - gs);
                    }
                    let next = parts[gs + 1];
                    const p = parts[gs + 2];
                    const p2 = parts[gs + 3];
                    if (next !== '..')
                        continue;
                    if (!p ||
                        p === '.' ||
                        p === '..' ||
                        !p2 ||
                        p2 === '.' ||
                        p2 === '..' ||
                        globParts.length >= braceExpandMax) {
                        continue;
                    }
                    didSomething = true;
                    // edit parts in place, and push the new one
                    parts.splice(gs, 1);
                    const other = parts.slice(0);
                    other[gs] = '**';
                    globParts.push(other);
                    gs--;
                }
                // <pre>/<e>/<rest> -> <pre>/<rest>
                if (!this.preserveMultipleSlashes) {
                    for (let i = 1; i < parts.length - 1; i++) {
                        const p = parts[i];
                        // don't squeeze out UNC patterns
                        if (i === 1 && p === '' && parts[0] === '')
                            continue;
                        if (p === '.' || p === '') {
                            didSomething = true;
                            parts.splice(i, 1);
                            i--;
                        }
                    }
                    if (parts[0] === '.' &&
                        parts.length === 2 &&
                        (parts[1] === '.' || parts[1] === '')) {
                        didSomething = true;
                        parts.pop();
                    }
                }
                // <pre>/<p>/../<rest> -> <pre>/<rest>
                // .. can not remove the root of a Windows path
                const root = this.#rootIndex(parts) + 1;
                let dd = root;
                while (-1 !== (dd = parts.indexOf('..', dd + 1))) {
                    const p = parts[dd - 1];
                    if (p && p !== '.' && p !== '..' && p !== '**') {
                        didSomething = true;
                        const needDot = dd === 1 && parts[dd + 1] === '**';
                        const splin = needDot ? ['.'] : [];
                        parts.splice(dd - 1, 2, ...splin);
                        if (parts.length === 0)
                            parts.push('');
                        dd = Math.max(dd - 2, root);
                    }
                }
            }
        } while (didSomething);
        return globParts;
    }
    // second phase: multi-pattern dedupes
    // {<pre>/*/<rest>,<pre>/<p>/<rest>} -> <pre>/*/<rest>
    // {<pre>/<rest>,<pre>/<rest>} -> <pre>/<rest>
    // {<pre>/**/<rest>,<pre>/<rest>} -> <pre>/**/<rest>
    //
    // {<pre>/**/<rest>,<pre>/**/<p>/<rest>} -> <pre>/**/<rest>
    // ^-- not valid because ** doens't follow symlinks
    secondPhasePreProcess(globParts) {
        // each pattern is compared to each other one, so skip this for
        // large sets. The patterns match the same paths either way.
        if (globParts.length > 1000)
            return globParts;
        for (let i = 0; i < globParts.length - 1; i++) {
            for (let j = i + 1; j < globParts.length; j++) {
                const matched = this.partsMatch(globParts[i], globParts[j], !this.preserveMultipleSlashes);
                if (matched) {
                    globParts[i] = [];
                    globParts[j] = matched;
                    break;
                }
            }
        }
        return globParts.filter(gs => gs.length);
    }
    partsMatch(a, b, emptyGSMatch = false) {
        let ai = 0;
        let bi = 0;
        let result = [];
        let which = '';
        while (ai < a.length && bi < b.length) {
            if (a[ai] === b[bi]) {
                result.push(which === 'b' ? b[bi] : a[ai]);
                ai++;
                bi++;
            }
            else if (emptyGSMatch && a[ai] === '**' && b[bi] === a[ai + 1]) {
                result.push(a[ai]);
                ai++;
            }
            else if (emptyGSMatch && b[bi] === '**' && a[ai] === b[bi + 1]) {
                result.push(b[bi]);
                bi++;
            }
            else if (a[ai] === '*' &&
                b[bi] &&
                (this.options.dot || !b[bi].startsWith('.')) &&
                b[bi] !== '**') {
                if (which === 'b')
                    return false;
                which = 'a';
                result.push(a[ai]);
                ai++;
                bi++;
            }
            else if (b[bi] === '*' &&
                a[ai] &&
                (this.options.dot || !a[ai].startsWith('.')) &&
                a[ai] !== '**') {
                if (which === 'a')
                    return false;
                which = 'b';
                result.push(b[bi]);
                ai++;
                bi++;
            }
            else {
                return false;
            }
        }
        // if we fall out of the loop, it means they two are identical
        // as long as their lengths match
        return a.length === b.length && result;
    }
    parseNegate() {
        if (this.nonegate)
            return;
        const pattern = this.pattern;
        let negate = false;
        let negateOffset = 0;
        for (let i = 0; i < pattern.length && pattern.charAt(i) === '!'; i++) {
            negate = !negate;
            negateOffset++;
        }
        if (negateOffset)
            this.pattern = pattern.slice(negateOffset);
        this.negate = negate;
    }
    // Match the parts of a path against one row of the set. `resolved`
    // is the parts after level 2 resolves `.` and `..` in them, or the
    // same parts below level 2. Set partial to true to test if, for
    // example, "/a/b" matches the start of "/*/b/*/d". Partial means, if
    // you run out of file before you run out of pattern, then that's
    // fine, as long as all the parts match.
    #matchRow(file, resolved, pattern, partial) {
        let fileStartIndex = 0;
        let patternStartIndex = 0;
        // UNC paths like //?/X:/... can match X:/... and vice versa, and
        // //?/UNC/host/share/... can match //host/share/... and vice versa.
        // Drive letters in absolute drive or unc paths, and the host and
        // share of UNC paths, are always compared case-insensitively.
        const fh = this.isWindows ? uncHost(resolved) : -1;
        const ph = fh === -1 ? -1 : uncHost(pattern);
        if (ph !== -1) {
            const host = pattern[ph];
            const share = pattern[ph + 1];
            if (typeof host !== 'string' || typeof share !== 'string') {
                // a host or share with magic is matched as usual
                fileStartIndex = fh;
                patternStartIndex = ph;
            }
            else if (resolved[fh].toLowerCase() === host.toLowerCase() &&
                resolved[fh + 1].toLowerCase() === share.toLowerCase()) {
                fileStartIndex = fh + 2;
                patternStartIndex = ph + 2;
            }
        }
        else if (this.isWindows) {
            const fileDrive = typeof file[0] === 'string' && /^[a-z]:$/i.test(file[0]);
            const fileUNC = !fileDrive &&
                file[0] === '' &&
                file[1] === '' &&
                file[2] === '?' &&
                /^[a-z]:$/i.test(file[3]);
            const patternDrive = typeof pattern[0] === 'string' && /^[a-z]:$/i.test(pattern[0]);
            const patternUNC = !patternDrive &&
                pattern[0] === '' &&
                pattern[1] === '' &&
                pattern[2] === '?' &&
                typeof pattern[3] === 'string' &&
                /^[a-z]:$/i.test(pattern[3]);
            const fdi = fileUNC ? 3
                : fileDrive ? 0
                    : undefined;
            const pdi = patternUNC ? 3
                : patternDrive ? 0
                    : undefined;
            if (typeof fdi === 'number' && typeof pdi === 'number') {
                const [fd, pd] = [
                    file[fdi],
                    pattern[pdi],
                ];
                // the drives match, so start matching after them
                if (fd.toLowerCase() === pd.toLowerCase()) {
                    patternStartIndex = pdi + 1;
                    fileStartIndex = fdi + 1;
                }
            }
        }
        // the drive letters are found in the parts before level 2 resolves
        // them, and the match uses the resolved parts
        file = resolved;
        if (pattern.includes(GLOBSTAR)) {
            return this.#matchGlobstar(file, pattern, partial, fileStartIndex, patternStartIndex);
        }
        return this.#matchOne(file, pattern, partial, fileStartIndex, patternStartIndex);
    }
    #matchGlobstar(file, pattern, partial, fileIndex, patternIndex) {
        const { head, body, tail, segments } = this.#getGlobstarParts(pattern, partial, patternIndex);
        // check the head, from the current file/pattern index.
        if (head.length) {
            const headEnd = fileIndex + head.length;
            if (!this.#matchOne(file, head, partial, fileIndex, 0, headEnd)) {
                return false;
            }
            fileIndex += head.length;
            patternIndex += head.length;
        }
        // now we know the head matches!
        // if the last portion is not empty, it MUST match the end
        // check the tail
        let fileTailMatch = 0;
        if (tail.length) {
            // if head + tail > file, then we cannot possibly match
            if (tail.length + fileIndex > file.length)
                return false;
            // try to match the tail
            let tailStart = file.length - tail.length;
            if (this.#matchOne(file, tail, partial, tailStart, 0)) {
                fileTailMatch = tail.length;
            }
            else {
                // affordance for stuff like a/**/* matching a/b/
                // if the last file portion is '', and there's more to the pattern
                // then try without the '' bit.
                if (file[file.length - 1] !== '' ||
                    fileIndex + tail.length === file.length) {
                    return false;
                }
                tailStart--;
                if (!this.#matchOne(file, tail, partial, tailStart, 0)) {
                    return false;
                }
                fileTailMatch = tail.length + 1;
            }
        }
        // now we know the tail matches!
        // the middle is zero or more portions wrapped in **, possibly
        // containing more ** sections.
        // so a/**/b/**/c/**/d has become **/b/**/c/**
        // if it's empty, it means a/**/b, just verify we have no bad dots
        // if there's no tail, so it ends on /**, then we must have *something*
        // after the head, or it's not a matc
        if (!body.length) {
            let sawSome = !!fileTailMatch;
            for (let i = fileIndex; i < file.length - fileTailMatch; i++) {
                const f = String(file[i]);
                sawSome = true;
                if (f === '.' ||
                    f === '..' ||
                    (!this.options.dot && f.startsWith('.'))) {
                    return false;
                }
            }
            // in partial mode, we just need to get past all file parts
            return partial || sawSome;
        }
        // now we know that there's one or more body sections, which can
        // be matched anywhere from the 0 index (because the head was pruned)
        // through to the length-fileTailMatch index.
        return !!this.#matchGlobStarBodySections(file, segments, file.length - fileTailMatch, fileIndex, 0, partial, 0, !!fileTailMatch, new Set());
    }
    // Split the pattern into head, tail, and middle of ** delimited
    // parts. The tail has to be at the end, and the others just have to
    // be found in order from the head. These only depend on the pattern
    // row, so they are kept for the next path.
    #getGlobstarParts(pattern, partial, patternIndex) {
        let byStart = this.#globstarParts.get(pattern);
        if (!byStart) {
            byStart = [];
            this.#globstarParts.set(pattern, byStart);
        }
        const key = patternIndex * 2 + (partial ? 1 : 0);
        const found = byStart[key];
        if (found)
            return found;
        const firstgs = pattern.indexOf(GLOBSTAR, patternIndex);
        const lastgs = pattern.lastIndexOf(GLOBSTAR);
        const head = pattern.slice(patternIndex, firstgs);
        const body = pattern.slice(firstgs + 1, partial ? undefined : lastgs);
        const tail = partial ? [] : pattern.slice(lastgs + 1);
        // split the body up into sections, and note the number of
        // portions that must come after the start of each one
        const segments = [[[], 0]];
        let current = segments[0];
        let nonGsParts = 0;
        const nonGsPartsSums = [0];
        for (const b of body) {
            if (b === GLOBSTAR) {
                nonGsPartsSums.push(nonGsParts);
                current = [[], 0];
                segments.push(current);
            }
            else {
                current[0].push(b);
                nonGsParts++;
            }
        }
        // the portions in this section and the ones after it
        segments.forEach((b, i) => {
            b[1] = nonGsParts - nonGsPartsSums[i];
        });
        const parts = { head, body, tail, segments };
        byStart[key] = parts;
        return parts;
    }
    // return false for "nope, not matching"
    // return null for "not matching, cannot keep trying"
    #matchGlobStarBodySections(file,
    // pattern section, and the portions that it and the rest need
    bodySegments,
    // the end of the file portions that the body can match
    fileLength, fileIndex, bodyIndex, partial, globStarDepth, sawTail,
    // the places that a walk has already tried, as
    // bodyIndex * (file.length + 1) + fileIndex. A walk from a place
    // does the same no matter how it got there, and it only comes back
    // if it found no match, so a walk that gets to one stops.
    tried) {
        // take the first body segment, and walk from fileIndex to its "after"
        // value at the end
        // If it doesn't match at that position, we increment, until we hit
        // that final possible position, and give up.
        // If it does match, then advance and try to rest.
        // If any of them fail we keep walking forward.
        // this is still a bit recursively painful, but it's more constrained
        // than previous implementations, because we never test something that
        // can't possibly be a valid matching condition.
        const bs = bodySegments[bodyIndex];
        if (!bs) {
            // with partial, the body is the rest of the pattern, so it
            // matches if no portions are left, or only the '' of a trailing
            // / (as a/* matches a/b/). A ** at the end walks them as its own
            // empty section.
            if (partial) {
                return (fileIndex >= fileLength ||
                    (fileIndex === fileLength - 1 && file[fileIndex] === ''));
            }
            // just make sure that there's no bad dots before the tail
            for (let i = fileIndex; i < fileLength; i++) {
                sawTail = true;
                const f = file[i];
                if (f === '.' ||
                    f === '..' ||
                    (!this.options.dot && f.startsWith('.'))) {
                    return false;
                }
            }
            return sawTail;
        }
        // have a non-globstar body section to test, up to the last index
        // where it can start
        const [body, need] = bs;
        // with partial, the path can end before the body does
        const after = partial ? fileLength : fileLength - need;
        while (fileIndex <= after) {
            const key = bodyIndex * (file.length + 1) + fileIndex;
            if (tried.has(key))
                return false;
            tried.add(key);
            const m = this.#matchOne(file, body, partial, fileIndex, 0, fileIndex + body.length);
            // if limit exceeded, no match. intentional false negative,
            // acceptable break in correctness for security.
            if (m && globStarDepth < this.maxGlobstarRecursion) {
                // match! see if the rest match. if so, we're done!
                const sub = this.#matchGlobStarBodySections(file, bodySegments, fileLength, fileIndex + body.length, bodyIndex + 1, partial, globStarDepth + 1, sawTail, tried);
                if (sub !== false) {
                    return sub;
                }
            }
            // the ** does not walk past the last place the body can start
            if (fileIndex === after)
                break;
            const f = file[fileIndex];
            if (f === '.' ||
                f === '..' ||
                (!this.options.dot && f.startsWith('.'))) {
                return false;
            }
            fileIndex++;
        }
        // walked off. no point continuing
        return partial || null;
    }
    #matchOne(file, pattern, partial, fileIndex, patternIndex,
    // only match the file portions before this index
    fileEnd = file.length) {
        let fi;
        let pi;
        let pl;
        let fl;
        for (fi = fileIndex,
            pi = patternIndex,
            fl = Math.min(fileEnd, file.length),
            pl = pattern.length; fi < fl && pi < pl; fi++, pi++) {
            let p = pattern[pi];
            let f = file[fi];
            // should be impossible.
            /* c8 ignore start */
            if (p === false || p === GLOBSTAR) {
                return false;
            }
            /* c8 ignore stop */
            // something other than **
            // non-magic patterns just have to match exactly
            // patterns with magic have been turned into Matchers.
            if (!portionMatch(p, f))
                return false;
        }
        // Note: ending in / means that we'll get a final ""
        // at the end of the pattern.  This can only match a
        // corresponding "" at the end of the file.
        // If the file ends in /, then it can only match a
        // a pattern that ends in /, unless the pattern just
        // doesn't have any more for it. But, a/b/ should *not*
        // match "a/b/*", even though * can match "", except in
        // partial mode, where it might simply not be reached yet.
        // However, a/b/ should still satisfy a/*
        // now either we fell off the end of the pattern, or we're done.
        if (fi === fl && pi === pl) {
            // ran out of pattern and filename at the same time.
            // an exact hit!
            return true;
        }
        else if (fi === fl) {
            // ran out of file, but still had pattern left.
            // this is ok if we're doing the match as part of
            // a glob fs traversal.
            return partial;
        }
        else if (pi === pl) {
            // ran out of pattern, still have file left.
            // this is only acceptable if we're on the very last
            // empty segment of a file with a trailing slash.
            // a/* should match a/b/
            return fi === fl - 1 && file[fi] === '';
            /* c8 ignore start */
        }
        else {
            // should be unreachable.
            throw new Error('wtf?');
        }
        /* c8 ignore stop */
    }
    braceExpand() {
        return braceExpand(this.pattern, this.options);
    }
    parse(pattern) {
        assertValidPattern(pattern);
        const options = this.options;
        // shortcuts
        if (pattern === '**')
            return GLOBSTAR;
        if (pattern === '')
            return '';
        const { nocase, nocaseMagicOnly, noext = false, dot, normalize, } = options;
        // Node 22 treats an entire empty extglob portion as literal text.
        if (!noext && /^[?*+@]\(\|*\)$/.test(pattern))
            return this.#norm(pattern);
        const lit = literal(pattern, noext);
        // in nocase mode, a literal with cased chars still needs a
        // Matcher, unless nocaseMagicOnly is set.
        if (lit !== undefined &&
            !(nocase &&
                !nocaseMagicOnly &&
                pattern.toUpperCase() !== pattern.toLowerCase())) {
            return this.#norm(lit);
        }
        if (this.#pending)
            return PENDING;
        let m = this.#matchers.get(pattern);
        if (!m) {
            m = new Matcher(pattern, { nocase, noext, dot, normalize });
            this.#matchers.set(pattern, m);
        }
        return m;
    }
    #slashSplit(p) {
        // if p starts with // on windows, we preserve that
        // so that UNC paths aren't broken.  Otherwise, any number of
        // / characters are coalesced into one, unless
        // preserveMultipleSlashes is set to true.
        if (this.preserveMultipleSlashes) {
            return p.split('/');
        }
        else if (this.isWindows && /^\/\/[^/]+/.test(p)) {
            // add an extra '' for the one we lose
            return ['', ...p.split(/\/+/)];
        }
        else {
            return p.split(/\/+/);
        }
    }
    match(f, partial = this.partial) {
        // short-circuit in the case of busted things.
        // comments, etc.
        if (this.comment) {
            return false;
        }
        if (this.empty) {
            return f === '';
        }
        if (f === '/' && partial) {
            return true;
        }
        const options = this.options;
        // treat the test path as a set of pathparts. If it was not just
        // split or checked, check that it can match before splitting it.
        let split = this.#cachedSplit(f);
        if (!split) {
            // the checks look at the path as given, so not if it is
            // normalized
            if (!partial &&
                !this.#form &&
                (this.#endCheck || this.#literalCheck) &&
                lastChecked !== f) {
                lastChecked = f;
                const can = this.#canMatch(f);
                if (can === 'no')
                    return options.flipNegate ? false : this.negate;
                if (can === 'yes')
                    return options.flipNegate ? true : !this.negate;
            }
            split = this.#split(f);
        }
        const ff = split.parts;
        // the parts after level 2 resolves them, kept for the next pattern
        // that tests the same path
        const resolved = this.#level2 ?
            (split.resolved ??= this.#levelTwoFileOptimize(ff))
            : ff;
        // just ONE of the pattern sets in this.set needs to match
        // in order for it to be valid.  If negating, then just one
        // match means that we have failed.
        // Either way, return on the first hit.
        const set = this.set;
        // Find the basename of the path by looking for the last non-empty segment
        let filename = ff[ff.length - 1];
        if (!filename) {
            for (let i = ff.length - 2; !filename && i >= 0; i--) {
                filename = ff[i];
            }
        }
        for (let r = 0; r < set.length; r++) {
            const pattern = set[r];
            const shape = partial ? undefined : this.#shapes[r];
            // level 2 does not change a path of one portion
            const hit = shape === 'base' ?
                portionMatch(pattern[0], filename)
                : shape ? this.#matchShape(resolved, pattern, shape)
                    : options.matchBase && pattern.length === 1 ?
                        this.#matchRow([filename], [filename], pattern, partial)
                        : this.#matchRow(ff, resolved, pattern, partial);
            if (hit) {
                if (options.flipNegate) {
                    return true;
                }
                return !this.negate;
            }
        }
        // didn't get any hits.  this is success if it's a negative
        // pattern, failure otherwise.
        if (options.flipNegate) {
            return false;
        }
        return this.negate;
    }
    static defaults(def) {
        return minimatch.defaults(def).Minimatch;
    }
}
/* c8 ignore stop */
minimatch.Minimatch = Minimatch;
minimatch.escape = escape;
minimatch.unescape = unescape;

export { GLOBSTAR, Minimatch, minimatch };
