export const testBinarySend = async () => {
    const ws = new WebSocket('ws://localhost:9999/echo');
    await new Promise((resolve, reject) => {
        ws.onopen = resolve;
        ws.onerror = (event) => reject(new Error(event && event.message || 'WebSocket error'));
    });

    ws.send(new Uint8Array([1, 2, 3]).buffer);
    ws.send(new Uint8Array([0, 4, 5, 6, 0]).subarray(1, 4));
    ws.send(new Blob([new Uint8Array([7, 8, 9])]));
    ws.send('hello');

    while (ws.bufferedAmount !== 0) {
        await new Promise((resolve) => setImmediate(resolve));
    }
    return true;
};

export const testWebsocketStreamSend = async () => {
    const stream = new WebSocketStream('ws://localhost:9999/echo');
    const { writable } = await stream.opened;
    const writer = writable.getWriter();

    await writer.write('hello');
    await writer.write(new Uint8Array([1, 2, 3]).buffer);
    await writer.write(new Uint8Array([0, 4, 5, 6, 0]).subarray(1, 4));
    await writer.write(new Blob([new Uint8Array([7, 8, 9])]));
    return true;
};
