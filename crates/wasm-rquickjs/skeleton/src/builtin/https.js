// node:https stub implementation
// HTTPS will be implementable via WASI-HTTP later, stubbed for now

const NOT_SUPPORTED_ERROR = new Error('https is not yet supported in WebAssembly environment');

export function request(options, callback) {
    throw NOT_SUPPORTED_ERROR;
}

export function get(options, callback) {
    throw NOT_SUPPORTED_ERROR;
}

export function createServer(options, requestListener) {
    throw NOT_SUPPORTED_ERROR;
}

export class Agent {
    constructor() {
        throw NOT_SUPPORTED_ERROR;
    }
}

export const globalAgent = null;

export class Server {
    constructor() {
        throw NOT_SUPPORTED_ERROR;
    }
}

export default {
    request,
    get,
    createServer,
    Agent,
    globalAgent,
    Server,
};
