export const DEFAULT_AUTH_TIMEOUT = 10000;
export const DEFAULT_SOCKET_CONNECT_TIMEOUT = 10000;
export const DEFAULT_HEARTBEAT_INTERVAL = 30000;
export const DEFAULT_CONNECTION_BACKOFF = [250, 500, 1000, 5000];
export const DEFAULT_AUTH_BACKOFF = [250, 500, 1000, 5000];
export const DEFAULT_MAX_CONN_TRIES = 5;
export const DEFAULT_MAX_AUTH_TRIES = 5;

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Configuration options for the socket.
 * @interface
 */
export interface SocketConfig {
  /**
   * The timeout for authenticating the socket.
   * @type {number}
   * @default DEFAULT_AUTH_TIMEOUT
   */
  authTimeout?: number;

  /**
   * The timeout for connecting to the socket.
   * @type {number}
   * @default DEFAULT_SOCKET_CONNECT_TIMEOUT
   */
  socketConnectTimeout?: number;

  /**
   * The interval for sending heartbeat signals.
   * @type {number}
   * @default DEFAULT_HEARTBEAT_INTERVAL
   */
  heartbeatInterval?: number;

  /**
   * The backoff intervals for reconnecting to the socket on connection loss.
   * @type {number[]}
   * @default DEFAULT_CONNECTION_BACKOFF
   */
  connectionBackoff?: number[];

  /**
   * The backoff intervals for reattempting authentication on failure.
   * @type {number[]}
   * @default DEFAULT_AUTH_BACKOFF
   */
  authBackoff?: number[];

  /**
   * The maximum number of connection retry attempts.
   * @type {number}
   * @default DEFAULT_MAX_CONN_TRIES
   */
  maxConnTries?: number;

  /**
   * The maximum number of authentication retry attempts.
   * @type {number}
   * @default DEFAULT_MAX_AUTH_TRIES
   */
  maxAuthTries?: number;
}

/**
 * Configuration options for connecting to a room.
 * @interface
 */
export interface ConnOptions {
  /**
   * A boolean indicating whether to wait for the room to become available.
   * @type {boolean}
   * @default false
   */
  waitForRoom?: boolean;

  /**
   * The host address for the connection.
   * @type {string}
   * @required
   */
  host: string;

  /**
   * The name of the room to connect to.
   * @type {string}
   * @required
   */
  room: string;

  /**
   * Configuration options for the socket connection.
   * @type {SocketConfig}
   */
  config?: SocketConfig;

  /**
   * The user's ID for authentication purposes.
   * @type {string}
   */
  userId?: string;

  /**
   * The party name.
   * @type {string}
   */
  party?: string;

  /**
   * A function or promise that handles authentication.
   * in response you can overide host & url
   * @type {() => any | Promise<any>}
   */
  auth?: () => any | Promise<any>;

  /**
   * A function for resolveing connection.
   * Used when waitForRoom is set to true
   * @type {(message: MessageEvent<any>, resolver: () => void) => void}
   */
  connectionResolver?: (
    message: MessageEvent<any>,
    resolver: () => void
  ) => void;

  /**
   * The timeout for authenticating the socket.
   * @type {LogLevel}
   * @default undefined
   */
  logLevel?: LogLevel;
}
