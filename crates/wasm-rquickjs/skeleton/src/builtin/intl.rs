use chrono::{DateTime, Datelike, Timelike, Utc};

#[rquickjs::module]
pub mod native_module {
    use rquickjs::prelude::*;

    // Returns flat tuple: (year, month, day, hour, minute, second, weekday, utc_offset_minutes, error)
    #[rquickjs::function]
    pub fn intl_dtf_resolve_fields(
        timestamp_ms: f64,
        timezone: String,
    ) -> List<(i32, u32, u32, u32, u32, u32, u32, i32, Option<String>)> {
        match super::dtf_resolve_impl(timestamp_ms, &timezone) {
            Ok(r) => List((
                r.year,
                r.month,
                r.day,
                r.hour,
                r.minute,
                r.second,
                r.weekday,
                r.utc_offset_minutes,
                None,
            )),
            Err(error) => List((0, 0, 0, 0, 0, 0, 0, 0, Some(error))),
        }
    }

    #[rquickjs::function]
    pub fn intl_validate_timezone(tz: String) -> bool {
        super::validate_timezone_impl(&tz)
    }

    #[rquickjs::function]
    pub fn intl_collator_compare(
        a: String,
        b: String,
        sensitivity: String,
        numeric: bool,
        ignore_punctuation: bool,
    ) -> i32 {
        super::collator_compare_impl(&a, &b, &sensitivity, numeric, ignore_punctuation)
    }

    // Returns a JSON-encoded array of segments: [[utf16_start, segment_str, is_word_like], ...]
    // granularity: "grapheme" | "word" | "sentence"
    // For "grapheme" and "sentence", is_word_like is always false.
    // For "word", is_word_like indicates whether the segment is word-like (letters/numbers).
    #[rquickjs::function]
    pub fn intl_segment(text: String, granularity: String) -> String {
        super::segment_impl(&text, &granularity)
    }
}

struct DtfResolved {
    year: i32,
    month: u32,
    day: u32,
    hour: u32,
    minute: u32,
    second: u32,
    weekday: u32,
    utc_offset_minutes: i32,
}

fn dtf_resolve_impl(
    timestamp_ms: f64,
    timezone: &str,
) -> Result<DtfResolved, String> {
    let dt = DateTime::<Utc>::from_timestamp_millis(timestamp_ms as i64)
        .ok_or_else(|| format!("Invalid timestamp: {timestamp_ms}"))?;

    if timezone.eq_ignore_ascii_case("UTC") {
        let civil = dt.with_timezone(&Utc);
        Ok(DtfResolved {
            year: civil.year(),
            month: civil.month(),
            day: civil.day(),
            hour: civil.hour(),
            minute: civil.minute(),
            second: civil.second(),
            weekday: civil.weekday().num_days_from_monday() + 1,
            utc_offset_minutes: 0,
        })
    } else {
        resolve_named_timezone(dt, timezone)
    }
}

#[cfg(feature = "timezone")]
fn resolve_named_timezone(
    dt: DateTime<Utc>,
    timezone: &str,
) -> Result<DtfResolved, String> {
    use chrono::Offset;
    use std::str::FromStr;

    let tz = chrono_tz::Tz::from_str(timezone)
        .map_err(|_| format!("Invalid timezone: {timezone}"))?;
    let civil = dt.with_timezone(&tz);
    let offset_seconds = civil.offset().fix().local_minus_utc();
    Ok(DtfResolved {
        year: civil.year(),
        month: civil.month(),
        day: civil.day(),
        hour: civil.hour(),
        minute: civil.minute(),
        second: civil.second(),
        weekday: civil.weekday().num_days_from_monday() + 1,
        utc_offset_minutes: offset_seconds / 60,
    })
}

#[cfg(not(feature = "timezone"))]
fn resolve_named_timezone(
    _dt: DateTime<Utc>,
    timezone: &str,
) -> Result<DtfResolved, String> {
    Err(format!(
        "Named timezone '{timezone}' is not supported without the 'timezone' feature"
    ))
}

fn validate_timezone_impl(tz: &str) -> bool {
    if tz.eq_ignore_ascii_case("UTC") {
        return true;
    }
    validate_named_timezone(tz)
}

#[cfg(feature = "timezone")]
fn validate_named_timezone(tz: &str) -> bool {
    use std::str::FromStr;
    chrono_tz::Tz::from_str(tz).is_ok()
}

#[cfg(not(feature = "timezone"))]
fn validate_named_timezone(_tz: &str) -> bool {
    false
}

fn collator_compare_impl(
    a: &str,
    b: &str,
    sensitivity: &str,
    numeric: bool,
    ignore_punctuation: bool,
) -> i32 {
    let mut a_str = a.to_string();
    let mut b_str = b.to_string();

    if ignore_punctuation {
        a_str = a_str.chars().filter(|c| c.is_alphanumeric() || c.is_whitespace()).collect();
        b_str = b_str.chars().filter(|c| c.is_alphanumeric() || c.is_whitespace()).collect();
    }

    if numeric {
        let a_num = extract_leading_number(&a_str);
        let b_num = extract_leading_number(&b_str);
        if let (Some((a_val, a_rest)), Some((b_val, b_rest))) = (a_num, b_num) {
            if a_val != b_val {
                return if a_val < b_val { -1 } else { 1 };
            }
            a_str = a_rest;
            b_str = b_rest;
        }
    }

    let result = match sensitivity {
        "base" | "accent" => a_str.to_lowercase().cmp(&b_str.to_lowercase()),
        _ => a_str.cmp(&b_str),
    };

    match result {
        std::cmp::Ordering::Less => -1,
        std::cmp::Ordering::Equal => 0,
        std::cmp::Ordering::Greater => 1,
    }
}

fn extract_leading_number(s: &str) -> Option<(f64, String)> {
    let num_end = s
        .char_indices()
        .take_while(|(_, c)| c.is_ascii_digit() || *c == '.')
        .last()
        .map(|(i, c)| i + c.len_utf8())
        .unwrap_or(0);
    if num_end == 0 {
        return None;
    }
    let num_str = &s[..num_end];
    num_str.parse::<f64>().ok().map(|v| (v, s[num_end..].to_string()))
}

fn segment_impl(text: &str, granularity: &str) -> String {
    use unicode_segmentation::UnicodeSegmentation;

    // Build segments with byte offsets, then convert to UTF-16 offsets for JS
    let mut result = String::from("[");
    let mut first = true;

    match granularity {
        "grapheme" => {
            let mut utf16_offset: usize = 0;
            for grapheme in text.graphemes(true) {
                if !first {
                    result.push(',');
                }
                first = false;
                let escaped = json_escape(grapheme);
                result.push_str(&format!("[{},\"{}\",false]", utf16_offset, escaped));
                utf16_offset += grapheme.encode_utf16().count();
            }
        }
        "word" => {
            let mut utf16_offset: usize = 0;
            for (_, segment) in text.split_word_bound_indices() {
                if !first {
                    result.push(',');
                }
                first = false;
                // A segment is "word-like" if it contains at least one alphanumeric character
                let is_word_like = segment.chars().any(|c| c.is_alphanumeric());
                let escaped = json_escape(segment);
                result.push_str(&format!(
                    "[{},\"{}\",{}]",
                    utf16_offset, escaped, is_word_like
                ));
                utf16_offset += segment.encode_utf16().count();
            }
        }
        "sentence" => {
            let mut utf16_offset: usize = 0;
            for (_, sentence) in text.split_sentence_bound_indices() {
                if !first {
                    result.push(',');
                }
                first = false;
                let escaped = json_escape(sentence);
                result.push_str(&format!("[{},\"{}\",false]", utf16_offset, escaped));
                utf16_offset += sentence.encode_utf16().count();
            }
        }
        _ => {
            // Unknown granularity, return empty
        }
    }

    result.push(']');
    result
}

fn json_escape(s: &str) -> String {
    let mut escaped = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '"' => escaped.push_str("\\\""),
            '\\' => escaped.push_str("\\\\"),
            '\n' => escaped.push_str("\\n"),
            '\r' => escaped.push_str("\\r"),
            '\t' => escaped.push_str("\\t"),
            c if (c as u32) < 0x20 => {
                escaped.push_str(&format!("\\u{:04x}", c as u32));
            }
            _ => escaped.push(c),
        }
    }
    escaped
}

pub const INTL_JS: &str = include_str!("intl.js");

pub const WIRE_JS: &str = r#"
        import * as __wasm_rquickjs_intl from '__wasm_rquickjs_builtin/intl';
        globalThis.Intl = __wasm_rquickjs_intl.Intl;
    "#;
