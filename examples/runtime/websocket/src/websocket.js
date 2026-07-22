// Regression coverage for GOL-223: a WebSocket must be able to send BINARY data
// (ArrayBuffer, typed array, and Blob) in addition to text. The host mock records
// every frame it receives; the real assertions live on the Rust side.

export const testBinarySend = async () => {
    const ws = new WebSocket('ws://localhost:9999/echo');

    // Wait until the socket is open (or fail fast if it errors).
    await new Promise((resolve, reject) => {
        ws.onopen = () => resolve();
        ws.onerror = (e) => reject(new Error((e && e.message) || 'WebSocket error'));
    });

    // Binary via ArrayBuffer.
    ws.send(new Uint8Array([1, 2, 3]).buffer);
    // Binary via typed array (ArrayBuffer view).
    ws.send(new Uint8Array([4, 5, 6]));
    // Binary via Blob (flushed asynchronously via Blob.arrayBuffer()).
    ws.send(new Blob([new Uint8Array([7, 8, 9])]));
    // Text.
    ws.send('hello');

    // Let the Blob's asynchronous read flush its send (its send_binary runs from
    // the arrayBuffer().then(...) job). All four sends complete on the JS job
    // queue before the host receive loop's first poll turn, so no frame is lost.
    await new Promise((resolve) => setTimeout(resolve, 100));

    return true;
};
