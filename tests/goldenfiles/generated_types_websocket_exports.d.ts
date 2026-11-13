declare module 'websocket' {
  export function testBinarySend(): boolean;
  export function testWebsocketStreamSend(): boolean;
  export function testSendSnapshotAndCloseOrder(): boolean;
  export function testReceiveCloseReentrancy(): boolean;
}
