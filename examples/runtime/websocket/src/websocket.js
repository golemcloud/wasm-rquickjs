// A WebSocket must be able to send binary data (ArrayBuffer, typed array, and
// Blob) as well as text. The host mock records every frame it receives; the
// assertions live on the Rust side.

export const testBinarySend = async () => {
    const ws = new WebSocket('ws://localhost:9999/echo');

    // Wait until the socket is open (or fail fast if it errors).
    await new Promise((resolve, reject) => {
        ws.onopen = () => resolve();
        ws.onerror = (e) => reject(new Error((e && e.message) || 'WebSocket error'));
    });

    // The four sends interleave sync and async paths on purpose: the Blob is
    // drained asynchronously, and the text after it must still land last. The
    // Rust side asserts the exact wire order [1,2,3], [4,5,6], [7,8,9], "hello".
    // Binary via ArrayBuffer.
    ws.send(new Uint8Array([1, 2, 3]).buffer);
    // Binary via typed array (ArrayBuffer view).
    ws.send(new Uint8Array([4, 5, 6]));
    // Binary via Blob (drained asynchronously via Blob.arrayBuffer()).
    ws.send(new Blob([new Uint8Array([7, 8, 9])]));
    // Text — enqueued behind the pending Blob so it cannot overtake it.
    ws.send('hello');

    // Let the Blob's asynchronous drain flush the queued frames before returning.
    await new Promise((resolve) => setTimeout(resolve, 100));

    return true;
};

// The WebSocketStream writable sink has its own send paths (string, ArrayBuffer,
// typed array, Blob). The Blob branch reads via Blob.arrayBuffer() and must send
// binary — not stringify the Blob to "[object Blob]". Writes go through a
// WritableStream, which serializes them, so awaiting each write keeps the order.
export const testWebsocketStreamSend = async () => {
    const wss = new WebSocketStream('ws://localhost:9999/echo');
    const { writable } = await wss.opened;
    const writer = writable.getWriter();

    await writer.write('hello');                          // text
    await writer.write(new Uint8Array([1, 2, 3]).buffer); // ArrayBuffer -> binary
    await writer.write(new Uint8Array([4, 5, 6]));        // typed array -> binary
    await writer.write(new Blob([new Uint8Array([7, 8, 9])])); // Blob -> binary

    try { await writer.close(); } catch (_) { /* mock may already be closed */ }

    return true;
};
