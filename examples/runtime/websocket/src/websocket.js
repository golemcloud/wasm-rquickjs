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
