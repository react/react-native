/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/**
 * A capability flag disables a specific feature/hack in the InspectorProxy
 * layer by indicating that the target supports one or more modern CDP features.
 */
export type TargetCapabilityFlags = Readonly<{
  /**
   * The target supports a stable page representation across reloads.
   *
   * In the proxy, this disables legacy page reload emulation and the
   * additional 'React Native Experimental' target in `/json/list`.
   *
   * In the launch flow, this allows targets to be matched directly by
   * `logicalDeviceId`.
   */
  nativePageReloads?: boolean,

  /**
   * The target supports fetching source code and source maps.
   *
   * In the proxy, this disables source fetching emulation and host rewrites.
   */
  nativeSourceCodeFetching?: boolean,

  /**
   * The target supports multiple concurrent debugger connections.
   *
   * When true, the proxy allows multiple debuggers to connect to the same
   * page simultaneously, each identified by a unique session ID.
   * When false (default/legacy), connecting a new debugger disconnects
   * any existing debugger connection to that page.
   */
  supportsMultipleDebuggers?: boolean,
}>;

// Page information received from the device. New page is created for
// each new instance of VM and can appear when user reloads React Native
// application.

export type PageFromDevice = Readonly<{
  id: string,
  title: string,
  /** Sent from modern targets only */
  description?: string,
  /** @deprecated This is sent from legacy targets only */
  vm?: string,
  app: string,
  capabilities?: TargetCapabilityFlags,
}>;

export type Page = Readonly<{
  ...PageFromDevice,
  capabilities: NonNullable<PageFromDevice['capabilities']>,
}>;

// Chrome Debugger Protocol message/event passed from device to proxy.
export type WrappedEventFromDevice = Readonly<{
  event: 'wrappedEvent',
  payload: Readonly<{
    pageId: string,
    wrappedEvent: string,
    sessionId?: string,
  }>,
}>;

// Chrome Debugger Protocol message/event passed from proxy to device.
export type WrappedEventToDevice = Readonly<{
  event: 'wrappedEvent',
  payload: Readonly<{
    pageId: string,
    wrappedEvent: string,
    sessionId: string,
  }>,
}>;

// Request sent from Inspector Proxy to Device when new debugger is connected
// to particular page.
export type ConnectRequest = Readonly<{
  event: 'connect',
  payload: Readonly<{pageId: string, sessionId: string}>,
}>;

// Request sent from Inspector Proxy to Device to notify that debugger is
// disconnected.
export type DisconnectRequest = Readonly<{
  event: 'disconnect',
  payload: Readonly<{pageId: string, sessionId: string}>,
}>;

// Request sent from Inspector Proxy to Device to get a list of pages.
export type GetPagesRequest = {event: 'getPages'};

// Response to GetPagesRequest containing a list of page infos.
export type GetPagesResponse = {
  event: 'getPages',
  payload: ReadonlyArray<PageFromDevice>,
};

// Union type for all possible messages sent from device to Inspector Proxy.
export type MessageFromDevice =
  | GetPagesResponse
  | WrappedEventFromDevice
  | DisconnectRequest;

// Union type for all possible messages sent from Inspector Proxy to device.
export type MessageToDevice =
  | GetPagesRequest
  | WrappedEventToDevice
  | ConnectRequest
  | DisconnectRequest;

// Page description object that is sent in response to /json HTTP request from debugger.
export type PageDescription = Readonly<{
  id: string,
  title: string,
  appId: string,
  description: string,
  type: string,
  devtoolsFrontendUrl: string,
  webSocketDebuggerUrl: string,

  // React Native specific fields
  /** @deprecated Prefer `title` */
  deviceName: string,
  /** @deprecated This is sent from legacy targets only */
  vm?: string,

  // React Native specific metadata
  reactNative: Readonly<{
    logicalDeviceId: string,
    capabilities: Page['capabilities'],
  }>,
}>;

export type JsonPagesListResponse = Array<PageDescription>;

// Response to /json/version HTTP request from the debugger specifying browser type and
// Chrome protocol version.
export type JsonVersionResponse = Readonly<{
  Browser: string,
  'Protocol-Version': string,
}>;

export type JSONSerializable =
  | boolean
  | number
  | string
  | null
  | ReadonlyArray<JSONSerializable>
  | {readonly [string]: JSONSerializable};

export type DeepReadOnly<T> =
  T extends ReadonlyArray<infer V>
    ? ReadonlyArray<DeepReadOnly<V>>
    : T extends {...}
      ? {readonly [K in keyof T]: DeepReadOnly<T[K]>}
      : T;
