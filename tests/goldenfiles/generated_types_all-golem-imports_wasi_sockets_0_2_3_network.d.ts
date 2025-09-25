declare module 'wasi:sockets/network@0.2.3' {
  export class Network {
  }
  /**
   * Error codes.
   * In theory, every API can return any error code.
   * In practice, API's typically only return the errors documented per API
   * combined with a couple of errors that are always possible:
   * - `unknown`
   * - `access-denied`
   * - `not-supported`
   * - `out-of-memory`
   * - `concurrency-conflict`
   * See each individual API for what the POSIX equivalents are. They sometimes differ per API.
   */
  export type ErrorCode = "unknown" | "access-denied" | "not-supported" | "invalid-argument" | "out-of-memory" | "timeout" | "concurrency-conflict" | "not-in-progress" | "would-block" | "invalid-state" | "new-socket-limit" | "address-not-bindable" | "address-in-use" | "remote-unreachable" | "connection-refused" | "connection-reset" | "connection-aborted" | "datagram-too-large" | "name-unresolvable" | "temporary-resolver-failure" | "permanent-resolver-failure";
  export type IpAddressFamily = "ipv4" | "ipv6";
  export type Ipv4Address = [number, number, number, number];
  export type Ipv6Address = [number, number, number, number, number, number, number, number];
  export type IpAddress = 
  {
    tag: 'ipv4'
    val: Ipv4Address
  } |
  {
    tag: 'ipv6'
    val: Ipv6Address
  };
  export type Ipv4SocketAddress = {
    /** sin_port */
    port: number;
    /** sin_addr */
    address: Ipv4Address;
  };
  export type Ipv6SocketAddress = {
    /** sin6_port */
    port: number;
    /** sin6_flowinfo */
    flowInfo: number;
    /** sin6_addr */
    address: Ipv6Address;
    /** sin6_scope_id */
    scopeId: number;
  };
  export type IpSocketAddress = 
  {
    tag: 'ipv4'
    val: Ipv4SocketAddress
  } |
  {
    tag: 'ipv6'
    val: Ipv6SocketAddress
  };
}
