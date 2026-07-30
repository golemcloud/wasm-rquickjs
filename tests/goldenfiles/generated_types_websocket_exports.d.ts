declare module 'websocket' {
  export function testBinarySend(): Promise<boolean>;
  export function testWebsocketStreamSend(): Promise<boolean>;
  export function testSendSnapshotAndCloseOrder(): Promise<boolean>;
}
