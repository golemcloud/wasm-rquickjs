// test1: Basic DateTimeFormat - NestJS ConsoleLogger pattern
export function test1() {
    try {
        // NestJS ConsoleLogger pattern
        const formatted = new Intl.DateTimeFormat(undefined, {
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            day: '2-digit',
            month: '2-digit',
        }).format(1741600245000); // 2025-03-10T14:30:45.000Z

        console.log("NestJS formatted:", formatted);

        // Verify it contains expected components
        if (!formatted.includes("2025")) {
            console.log("FAIL: missing year 2025");
            return false;
        }

        // node-cron pattern: get default timezone
        const tz = new Intl.DateTimeFormat().resolvedOptions().timeZone;
        console.log("Default timezone:", tz);
        if (tz !== "UTC") {
            console.log("FAIL: expected UTC timezone");
            return false;
        }

        // resolvedOptions
        const ro = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC' }).resolvedOptions();
        console.log("Resolved locale:", ro.locale);
        if (ro.locale !== "en-US") {
            console.log("FAIL: expected en-US locale");
            return false;
        }

        // supportedLocalesOf
        const sl = Intl.DateTimeFormat.supportedLocalesOf(['en', 'fr']);
        console.log("Supported locales:", JSON.stringify(sl));

        console.log("test1 PASSED");
        return true;
    } catch (e) {
        console.log("test1 FAILED:", e.message, e.stack);
        return false;
    }
}

// test2: DateTimeFormat.formatToParts
export function test2() {
    try {
        const dtf = new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'UTC',
            hour12: true,
        });

        const ts = Date.UTC(2025, 2, 10, 14, 30, 45); // March 10, 2025 14:30:45 UTC
        const parts = dtf.formatToParts(ts);
        console.log("Parts:", JSON.stringify(parts));

        // Verify key parts exist
        const types = parts.map(p => p.type);
        if (!types.includes("month") || !types.includes("day") || !types.includes("year")) {
            console.log("FAIL: missing date parts");
            return false;
        }
        if (!types.includes("hour") || !types.includes("minute") || !types.includes("second")) {
            console.log("FAIL: missing time parts");
            return false;
        }

        // Verify month is "03"
        const monthPart = parts.find(p => p.type === "month");
        if (monthPart.value !== "03") {
            console.log("FAIL: expected month 03, got", monthPart.value);
            return false;
        }

        // Verify day is "10"
        const dayPart = parts.find(p => p.type === "day");
        if (dayPart.value !== "10") {
            console.log("FAIL: expected day 10, got", dayPart.value);
            return false;
        }

        // Verify hour is "2" (2 PM in 12-hour)
        const hourPart = parts.find(p => p.type === "hour");
        if (hourPart.value !== "2") {
            console.log("FAIL: expected hour 2, got", hourPart.value);
            return false;
        }

        // Verify dayPeriod is "PM"
        const periodPart = parts.find(p => p.type === "dayPeriod");
        if (!periodPart || periodPart.value !== "PM") {
            console.log("FAIL: expected dayPeriod PM, got", periodPart);
            return false;
        }

        console.log("test2 PASSED");
        return true;
    } catch (e) {
        console.log("test2 FAILED:", e.message, e.stack);
        return false;
    }
}

// test3: NumberFormat
export function test3() {
    try {
        // Basic decimal
        const nf = new Intl.NumberFormat('en-US');
        const result = nf.format(1234567.89);
        console.log("Decimal:", result);
        if (!result.includes("1,234,567")) {
            console.log("FAIL: expected comma grouping");
            return false;
        }

        // Currency
        const cf = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
        const cResult = cf.format(1234.50);
        console.log("Currency:", cResult);
        if (!cResult.includes("$") || !cResult.includes("1,234")) {
            console.log("FAIL: expected $ and grouping");
            return false;
        }

        // Percent
        const pf = new Intl.NumberFormat('en-US', { style: 'percent' });
        const pResult = pf.format(0.75);
        console.log("Percent:", pResult);
        if (!pResult.includes("75") || !pResult.includes("%")) {
            console.log("FAIL: expected 75%");
            return false;
        }

        // minimumIntegerDigits (zero-padding) - Luxon uses this
        const padFmt = new Intl.NumberFormat('en-US', {
            minimumIntegerDigits: 2,
            useGrouping: false,
        });
        if (padFmt.format(5) !== "05") {
            console.log("FAIL: expected 05, got", padFmt.format(5));
            return false;
        }

        // formatToParts
        const parts = nf.formatToParts(1234.5);
        console.log("Parts:", JSON.stringify(parts));
        const types = parts.map(p => p.type);
        if (!types.includes("integer") || !types.includes("decimal") || !types.includes("fraction")) {
            console.log("FAIL: missing number parts");
            return false;
        }

        console.log("test3 PASSED");
        return true;
    } catch (e) {
        console.log("test3 FAILED:", e.message, e.stack);
        return false;
    }
}

// test4: Collator + PluralRules + statics
export function test4() {
    try {
        // Collator
        const col = new Intl.Collator('en-US');
        if (col.compare('a', 'b') >= 0) {
            console.log("FAIL: a should be < b");
            return false;
        }
        if (col.compare('b', 'a') <= 0) {
            console.log("FAIL: b should be > a");
            return false;
        }
        if (col.compare('a', 'a') !== 0) {
            console.log("FAIL: a should equal a");
            return false;
        }

        // Case-insensitive collation
        const ciCol = new Intl.Collator('en-US', { sensitivity: 'base' });
        if (ciCol.compare('A', 'a') !== 0) {
            console.log("FAIL: A should equal a with base sensitivity");
            return false;
        }

        // PluralRules
        const pr = new Intl.PluralRules('en-US');
        if (pr.select(1) !== "one") {
            console.log("FAIL: 1 should be 'one'");
            return false;
        }
        if (pr.select(2) !== "other") {
            console.log("FAIL: 2 should be 'other'");
            return false;
        }

        // Ordinal
        const ord = new Intl.PluralRules('en-US', { type: 'ordinal' });
        if (ord.select(1) !== "one") {
            console.log("FAIL: 1st should be 'one'");
            return false;
        }
        if (ord.select(2) !== "two") {
            console.log("FAIL: 2nd should be 'two'");
            return false;
        }
        if (ord.select(3) !== "few") {
            console.log("FAIL: 3rd should be 'few'");
            return false;
        }
        if (ord.select(4) !== "other") {
            console.log("FAIL: 4th should be 'other'");
            return false;
        }

        // getCanonicalLocales
        const cl = Intl.getCanonicalLocales('en');
        console.log("Canonical locales:", JSON.stringify(cl));

        // supportedValuesOf
        const calendars = Intl.supportedValuesOf('calendar');
        console.log("Calendars:", JSON.stringify(calendars));
        if (!calendars.includes("gregory")) {
            console.log("FAIL: should include gregory");
            return false;
        }

        // ListFormat and Segmenter should be defined
        if (typeof Intl.ListFormat !== "function") {
            console.log("FAIL: ListFormat should be a function");
            return false;
        }
        if (typeof Intl.Segmenter !== "function") {
            console.log("FAIL: Segmenter should be a function");
            return false;
        }

        // Stubs should be undefined
        if (Intl.RelativeTimeFormat !== undefined) {
            console.log("FAIL: RelativeTimeFormat should be undefined");
            return false;
        }

        console.log("test4 PASSED");
        return true;
    } catch (e) {
        console.log("test4 FAILED:", e.message, e.stack);
        return false;
    }
}

// test5: ListFormat
export function test5() {
    try {
        // Basic conjunction
        const lf = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
        const r1 = lf.format(['Alice', 'Bob', 'Carol']);
        console.log("Conjunction:", r1);
        if (r1 !== "Alice, Bob, and Carol") {
            console.log("FAIL: expected 'Alice, Bob, and Carol', got", r1);
            return false;
        }

        // Disjunction
        const lfOr = new Intl.ListFormat('en', { style: 'long', type: 'disjunction' });
        const r2 = lfOr.format(['Alice', 'Bob']);
        console.log("Disjunction:", r2);
        if (r2 !== "Alice or Bob") {
            console.log("FAIL: expected 'Alice or Bob', got", r2);
            return false;
        }

        // Empty and single item
        if (lf.format([]) !== "") {
            console.log("FAIL: empty list should format to ''");
            return false;
        }
        if (lf.format(['Alice']) !== "Alice") {
            console.log("FAIL: single item should format to 'Alice'");
            return false;
        }

        // formatToParts
        const parts = lf.formatToParts(['A', 'B', 'C']);
        console.log("Parts:", JSON.stringify(parts));
        const types = parts.map(p => p.type);
        if (types.filter(t => t === "element").length !== 3) {
            console.log("FAIL: expected 3 element parts");
            return false;
        }
        if (types.filter(t => t === "literal").length !== 2) {
            console.log("FAIL: expected 2 literal parts");
            return false;
        }

        // resolvedOptions
        const ro = lf.resolvedOptions();
        if (ro.type !== "conjunction" || ro.style !== "long") {
            console.log("FAIL: resolvedOptions mismatch");
            return false;
        }

        // Must be called with new
        try {
            Intl.ListFormat('en');
            console.log("FAIL: should throw without new");
            return false;
        } catch (e) {
            if (!e.message.includes("new")) {
                console.log("FAIL: wrong error without new:", e.message);
                return false;
            }
        }

        console.log("test5 PASSED");
        return true;
    } catch (e) {
        console.log("test5 FAILED:", e.message, e.stack);
        return false;
    }
}

// test6: Segmenter
export function test6() {
    try {
        // Grapheme segmentation
        const seg = new Intl.Segmenter('en', { granularity: 'grapheme' });
        const segments = [...seg.segment('Hello')];
        console.log("Graphemes:", JSON.stringify(segments.map(s => s.segment)));
        if (segments.length !== 5) {
            console.log("FAIL: expected 5 graphemes, got", segments.length);
            return false;
        }
        if (segments[0].segment !== 'H' || segments[0].index !== 0) {
            console.log("FAIL: first grapheme should be 'H' at index 0");
            return false;
        }
        if (segments[4].segment !== 'o' || segments[4].index !== 4) {
            console.log("FAIL: last grapheme should be 'o' at index 4");
            return false;
        }

        // Word segmentation
        const wordSeg = new Intl.Segmenter('en', { granularity: 'word' });
        const words = [...wordSeg.segment('Hello, World!')];
        console.log("Words:", JSON.stringify(words.map(s => ({ seg: s.segment, wl: s.isWordLike }))));
        // Should have word-like segments
        const wordLike = words.filter(s => s.isWordLike);
        if (wordLike.length < 2) {
            console.log("FAIL: expected at least 2 word-like segments");
            return false;
        }
        if (wordLike[0].segment !== 'Hello') {
            console.log("FAIL: first word should be 'Hello', got", wordLike[0].segment);
            return false;
        }

        // Sentence segmentation
        const sentSeg = new Intl.Segmenter('en', { granularity: 'sentence' });
        const sentences = [...sentSeg.segment('Hello. World!')];
        console.log("Sentences:", JSON.stringify(sentences.map(s => s.segment)));
        if (sentences.length < 2) {
            console.log("FAIL: expected at least 2 sentences, got", sentences.length);
            return false;
        }

        // containing()
        const segs = wordSeg.segment('Hello, World!');
        const c0 = segs.containing(0);
        console.log("Containing(0):", JSON.stringify(c0));
        if (!c0 || c0.segment !== 'Hello') {
            console.log("FAIL: containing(0) should return 'Hello'");
            return false;
        }
        if (c0.input !== 'Hello, World!') {
            console.log("FAIL: input should be original string");
            return false;
        }

        // containing() out of range
        if (segs.containing(99) !== undefined) {
            console.log("FAIL: containing(99) should return undefined");
            return false;
        }

        // resolvedOptions
        const ro = seg.resolvedOptions();
        if (ro.granularity !== "grapheme") {
            console.log("FAIL: resolvedOptions granularity mismatch");
            return false;
        }

        // Must be called with new
        try {
            Intl.Segmenter('en');
            console.log("FAIL: should throw without new");
            return false;
        } catch (e) {
            if (!e.message.includes("new")) {
                console.log("FAIL: wrong error without new:", e.message);
                return false;
            }
        }

        // Default granularity (used by string-width/yargs)
        const defaultSeg = new Intl.Segmenter();
        const defSegs = [...defaultSeg.segment('abc')];
        if (defSegs.length !== 3) {
            console.log("FAIL: default segmenter should produce 3 graphemes");
            return false;
        }

        console.log("test6 PASSED");
        return true;
    } catch (e) {
        console.log("test6 FAILED:", e.message, e.stack);
        return false;
    }
}
