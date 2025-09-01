/**
 * This interface provides a value-export of the default network handle..
 */
declare module 'wasi:sockets/instance-network@0.2.3' {
  import * as wasiSockets023Network from 'wasi:sockets/network@0.2.3';
  /**
   * Get a handle to the default network.
   */
  export function instanceNetwork(): Network;
  export type Network = wasiSockets023Network.Network;
}
