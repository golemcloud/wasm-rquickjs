// JS functions for the base64 implementation
pub const BASE64_JS: &str = include_str!("base64.js");

// JS code wiring atob/btoa into the global context
pub const WIRE_JS: &str = r#"
        globalThis.btoa = function btoa(str) {
            str = String(str);
            for (var i = 0; i < str.length; i++) {
                if (str.charCodeAt(i) > 255) {
                    throw new DOMException("Failed to execute 'btoa': The string to be encoded contains characters outside of the Latin1 range.", "InvalidCharacterError");
                }
            }
            var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            var result = '';
            for (var i = 0; i < str.length; i += 3) {
                var b0 = str.charCodeAt(i);
                var b1 = i + 1 < str.length ? str.charCodeAt(i + 1) : 0;
                var b2 = i + 2 < str.length ? str.charCodeAt(i + 2) : 0;
                result += lookup[b0 >> 2];
                result += lookup[((b0 & 3) << 4) | (b1 >> 4)];
                result += (i + 1 < str.length) ? lookup[((b1 & 0xF) << 2) | (b2 >> 6)] : '=';
                result += (i + 2 < str.length) ? lookup[b2 & 0x3F] : '=';
            }
            return result;
        };

        globalThis.atob = function atob(encoded) {
            encoded = String(encoded).replace(/[\t\n\f\r ]/g, '');
            if (encoded.length % 4 === 1) {
                throw new DOMException("Failed to execute 'atob': The string to be decoded is not correctly encoded.", "InvalidCharacterError");
            }
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            var lookup = {};
            for (var i = 0; i < chars.length; i++) lookup[chars[i]] = i;
            lookup['='] = 0;
            var result = '';
            for (var i = 0; i < encoded.length; i += 4) {
                var a = lookup[encoded[i]], b = lookup[encoded[i + 1]];
                var c = lookup[encoded[i + 2]], d = lookup[encoded[i + 3]];
                if (a === undefined || b === undefined) {
                    throw new DOMException("Failed to execute 'atob': The string to be decoded is not correctly encoded.", "InvalidCharacterError");
                }
                result += String.fromCharCode((a << 2) | (b >> 4));
                if (encoded[i + 2] !== '=') result += String.fromCharCode(((b & 0xF) << 4) | (c >> 2));
                if (encoded[i + 3] !== '=') result += String.fromCharCode(((c & 3) << 6) | d);
            }
            return result;
        };
    "#;
