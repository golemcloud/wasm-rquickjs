declare module 'websocket' {
  export function testBinarySend(): Promise<boolean>;
  export function testWebsocketStreamSend(): Promise<boolean>;
  export function testSendSnapshotAndCloseOrder(): Promise<boolean>;
  export function testReceiveCloseReentrancy(): Promise<boolean>;
}
