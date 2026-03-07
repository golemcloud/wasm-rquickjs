import {Readable} from 'node:stream';

export const createMockResponse = (body, statusCode = 200, headers = {}) => {
    const payload = typeof body === 'string' ? body : JSON.stringify(body);
    const response = new Readable({
        read() {
            this.push(payload);
            this.push(null);
        }
    });

    response.statusCode = statusCode;
    response.headers = headers;
    response.trailers = {};
    response.socket = null;
    response.aborted = false;
    response.complete = true;
    response.httpVersion = '1.1';
    response.httpVersionMinor = 1;
    response.httpVersionMajor = 1;

    return response;
};
