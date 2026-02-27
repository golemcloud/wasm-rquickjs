// Minimal node:_http_common compatibility used by HTTP header validator tests.

const HTTP_TOKEN_REGEX = /^[\^_`a-zA-Z\-0-9!#$%&'*+.|~]+$/;
const INVALID_HEADER_CHAR_REGEX = /[^\t\x20-\x7e\x80-\xff]/;

export function _checkIsHttpToken(value) {
    return HTTP_TOKEN_REGEX.test(value);
}

export function _checkInvalidHeaderChar(value) {
    return INVALID_HEADER_CHAR_REGEX.test(value);
}

export default {
    _checkIsHttpToken,
    _checkInvalidHeaderChar,
};
