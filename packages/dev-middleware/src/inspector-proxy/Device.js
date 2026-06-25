/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {EventReporter} from '../types/EventReporter';
import type {Experiments} from '../types/Experiments';
import type {ReadonlyURL} from '../types/ReadonlyURL';
import type {
  CDPClientMessage,
  CDPRequest,
  CDPResponse,
  CDPServerMessage,
} from './cdp-types/messages';
import type {
  CreateCustomMessageHandlerFn,
  CustomMessageHandler,
} from './CustomMessageHandler';
import type {
  MessageFromDevice,
  MessageToDevice,
  Page,
  TargetCapabilityFlags,
} from './types';

import CdpDebugLogging from './CdpDebugLogging';
import DeviceEventReporter from './DeviceEventReporter';
import crypto from 'crypto';
import invariant from 'invariant';
import WS from 'ws';

const debug = require('debug')('Metro:InspectorProxy');

const PAGES_POLLING_INTERVAL = 1000;

const WS_CLOSURE_CODE = {
  NORMAL: 1000,
  INTERNAL_ERROR: 1011,
};

// should be aligned with
// https://github.com/facebook/react-native-devtools-frontend/blob/3d17e0fd462dc698db34586697cce2371b25e0d3/front_end/ui/legacy/components/utils/TargetDetachedDialog.ts#L50-L64
export const WS_CLOSE_REASON = {
  PAGE_NOT_FOUND: '[PAGE_NOT_FOUND] Debugger page not found',
  CONNECTION_LOST: '[CONNECTION_LOST] Connection lost to corresponding device',
  RECREATING_DEVICE: '[RECREATING_DEVICE] Recreating device connection',
  NEW_DEBUGGER_OPENED:
    '[NEW_DEBUGGER_OPENED] New debugger opened for the same app instance',
};

// Prefix for script URLs that are alphanumeric IDs. See comment in #processMessageFromDeviceLegacy method for
// more details.
const FILE_PREFIX = 'file://';

type DebuggerConnection = {
  // Debugger web socket connection
  socket: WS,
  prependedFilePrefix: boolean,
  pageId: string,
  userAgent: string | null,
  customHandler: ?CustomMessageHandler,
  debuggerRelativeBaseUrl: ReadonlyURL,
  // Session ID assigned by the proxy for multi-debugger support
  sessionId: string,
};

const REACT_NATIVE_RELOADABLE_PAGE_ID = '-1';

export type DeviceOptions = Readonly<{
  id: string,
  name: string,
  app: string,
  socket: WS,
  eventReporter: ?EventReporter,
  createMessageMiddleware: ?CreateCustomMessageHandlerFn,
  deviceRelativeBaseUrl: ReadonlyURL,
  serverRelativeBaseUrl: ReadonlyURL,
  isProfilingBuild: boolean,
  experiments: Experiments,
}>;

/**
 * Device class represents single device connection to Inspector Proxy. Each device
 * can have multiple inspectable pages.
 */
export default class Device {
  // ID of the device.
  #id: string;

  // Name of the device.
  #name: string;

  // Package name of the app.
  #app: string;

  // Stores socket connection between Inspector Proxy and device.
  #deviceSocket: WS;

  // Stores the most recent listing of device's pages, keyed by the `id` field.
  #pages: ReadonlyMap<string, Page> = new Map();

  // Stores information about currently connected debuggers, keyed by sessionId.
  #debuggerConnections: Map<string, DebuggerConnection> = new Map();

  // Last known Page ID of the React Native page.
  // This is used by debugger connections that don't have PageID specified
  // (and will interact with the latest React Native page).
  #lastConnectedLegacyReactNativePage: ?Page = null;

  // Whether we are in the middle of a reload in the REACT_NATIVE_RELOADABLE_PAGE.
  #isLegacyPageReloading: boolean = false;

  // The previous "GetPages" message, for deduplication in debug logs.
  #lastGetPagesMessage: string = '';

  // Mapping built from scriptParsed events and used to fetch file content in `Debugger.getScriptSource`.
  #scriptIdToSourcePathMapping: Map<string, string> = new Map();

  #deviceEventReporter: ?DeviceEventReporter;

  #pagesPollingIntervalId: ReturnType<typeof setInterval>;

  // The device message middleware factory function allowing implementers to handle unsupported CDP messages.
  #createCustomMessageHandler: ?CreateCustomMessageHandlerFn;

  // A base HTTP(S) URL to this server, reachable from the device. Derived from
  // the http request that created the connection.
  #deviceRelativeBaseUrl: ReadonlyURL;

  // A base HTTP(S) URL to the server, relative to this server.
  #serverRelativeBaseUrl: ReadonlyURL;

  // Logging reporting batches of cdp messages
  #cdpDebugLogging: CdpDebugLogging;

  readonly #experiments: Experiments;

  constructor(deviceOptions: DeviceOptions) {
    this.#experiments = deviceOptions.experiments;
    this.#dangerouslyConstruct(deviceOptions);
  }

  #dangerouslyConstruct({
    id,
    name,
    app,
    socket,
    eventReporter,
    createMessageMiddleware,
    serverRelativeBaseUrl,
    deviceRelativeBaseUrl,
    isProfilingBuild,
  }: DeviceOptions) {
    this.#cdpDebugLogging = new CdpDebugLogging();
    this.#id = id;
    this.#name = name;
    this.#app = app;
    this.#deviceSocket = socket;
    this.#serverRelativeBaseUrl = serverRelativeBaseUrl;
    this.#deviceRelativeBaseUrl = deviceRelativeBaseUrl;
    this.#deviceEventReporter = eventReporter
      ? new DeviceEventReporter(eventReporter, {
          deviceId: id,
          deviceName: name,
          appId: app,
        })
      : null;
    this.#createCustomMessageHandler = createMessageMiddleware;

    if (isProfilingBuild) {
      this.#deviceEventReporter?.logProfilingTargetRegistered();
    }

    // $FlowFixMe[incompatible-type]
    this.#deviceSocket.on('message', (message: string) => {
      try {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.event === 'getPages') {
          // There's a 'getPages' message every second, so only show them if they change
          if (message !== this.#lastGetPagesMessage) {
            debug('Device getPages ping has changed: %s', message);
            this.#lastGetPagesMessage = message;
          }
        } else {
          this.#cdpDebugLogging.log('DeviceToProxy', message);
        }
        this.#handleMessageFromDevice(parsedMessage);
      } catch (error) {
        debug('%O\nHandling device message: %s', error, message);
        try {
          this.#deviceEventReporter?.logProxyMessageHandlingError(
            'device',
            error,
            message,
          );
        } catch (loggingError) {
          debug(
            'Error logging message handling error to reporter: %O',
            loggingError,
          );
        }
      }
    });

    // Sends 'getPages' request to device every PAGES_POLLING_INTERVAL milliseconds.
    this.#pagesPollingIntervalId = setInterval(
      () => this.#sendMessageToDevice({event: 'getPages'}),
      PAGES_POLLING_INTERVAL,
    );
    this.#deviceSocket.on('close', () => {
      if (socket === this.#deviceSocket) {
        this.#deviceEventReporter?.logDisconnection('device');
        // Device disconnected - close debugger connection.
        this.#terminateDebuggerConnection(
          WS_CLOSURE_CODE.NORMAL,
          WS_CLOSE_REASON.CONNECTION_LOST,
        );
        clearInterval(this.#pagesPollingIntervalId);
      }
    });
  }

  /**
   * Terminates debugger connection(s).
   * If sessionId is provided, terminates only that session.
   * If sessionId is not provided, terminates all sessions.
   */
  #terminateDebuggerConnection(
    code?: number,
    reason?: string,
    sessionId?: string,
  ) {
    if (sessionId != null) {
      // Terminate specific session
      const debuggerConnection = this.#debuggerConnections.get(sessionId);
      if (debuggerConnection) {
        // Delete from map first so #sendDisconnectEventToDevice can correctly
        // check if there are other debuggers connected to this page
        this.#debuggerConnections.delete(sessionId);
        this.#sendDisconnectEventToDevice(
          this.#mapToDevicePageId(debuggerConnection.pageId),
          sessionId,
        );
        debuggerConnection.socket.close(code, reason);
      }
    } else {
      // Terminate all sessions - collect connections first, then process
      const connections = Array.from(this.#debuggerConnections.entries());
      this.#debuggerConnections.clear();
      for (const [sid, debuggerConnection] of connections) {
        this.#sendDisconnectEventToDevice(
          this.#mapToDevicePageId(debuggerConnection.pageId),
          sid,
        );
        debuggerConnection.socket.close(code, reason);
      }
    }
  }

  /**
   * Used to recreate the device connection if there is a device ID collision.
   * 1. Checks if the same device is attempting to reconnect for the same app.
   * 2. If not, close both the device and debugger socket.
   * 3. If the debugger connection can be reused, close the device socket only.
   *
   * This hack attempts to allow users to reload the app, either as result of a
   * crash, or manually reloading, without having to restart the debugger.
   */
  dangerouslyRecreateDevice(deviceOptions: DeviceOptions) {
    invariant(
      deviceOptions.id === this.#id,
      'dangerouslyRecreateDevice() can only be used for the same device ID',
    );

    // Store existing debugger connections for potential reuse
    const oldDebuggerConnections = new Map(this.#debuggerConnections);

    if (this.#app !== deviceOptions.app || this.#name !== deviceOptions.name) {
      this.#deviceSocket.close(
        WS_CLOSURE_CODE.NORMAL,
        WS_CLOSE_REASON.RECREATING_DEVICE,
      );
      this.#terminateDebuggerConnection(
        WS_CLOSURE_CODE.NORMAL,
        WS_CLOSE_REASON.RECREATING_DEVICE,
      );
    }

    this.#debuggerConnections.clear();

    // Close the old device socket before reconstructing
    if (oldDebuggerConnections.size > 0) {
      this.#deviceSocket.close(
        WS_CLOSURE_CODE.NORMAL,
        WS_CLOSE_REASON.RECREATING_DEVICE,
      );
    }

    this.#dangerouslyConstruct(deviceOptions);

    // Restore all debugger connections, not just the first one
    for (const oldDebugger of oldDebuggerConnections.values()) {
      oldDebugger.socket.removeAllListeners();
      this.handleDebuggerConnection(oldDebugger.socket, oldDebugger.pageId, {
        debuggerRelativeBaseUrl: oldDebugger.debuggerRelativeBaseUrl,
        userAgent: oldDebugger.userAgent,
      });
    }
  }

  getName(): string {
    return this.#name;
  }

  getApp(): string {
    return this.#app;
  }

  getPagesList(): ReadonlyArray<Page> {
    if (this.#lastConnectedLegacyReactNativePage) {
      return [...this.#pages.values(), this.#createSyntheticPage()];
    } else {
      return [...this.#pages.values()];
    }
  }

  // Handles new debugger connection to this device:
  // 1. Sends connect event to device
  // 2. Forwards all messages from the debugger to device as wrappedEvent
  // 3. Sends disconnect event to device when debugger connection socket closes.
  handleDebuggerConnection(
    socket: WS,
    pageId: string,
    {
      debuggerRelativeBaseUrl,
      userAgent,
    }: Readonly<{
      debuggerRelativeBaseUrl: ReadonlyURL,
      userAgent: string | null,
    }>,
  ) {
    const page: ?Page =
      pageId === REACT_NATIVE_RELOADABLE_PAGE_ID
        ? this.#createSyntheticPage()
        : this.#pages.get(pageId);

    if (!page) {
      debug(
        `Got new debugger connection via ${debuggerRelativeBaseUrl.href} for ` +
          `page ${pageId} of ${this.#name}, but no such page exists`,
      );
      socket.close(
        WS_CLOSURE_CODE.INTERNAL_ERROR,
        WS_CLOSE_REASON.PAGE_NOT_FOUND,
      );
      return;
    }

    // Clear any commands we were waiting on.
    this.#deviceEventReporter?.logDisconnection('debugger');

    // Check if this specific page supports multiple debuggers.
    // If not (legacy mode), disconnect existing debuggers for THIS PAGE only
    // before connecting the new one.
    if (!this.#pageHasCapability(page, 'supportsMultipleDebuggers')) {
      for (const [sid, conn] of this.#debuggerConnections) {
        if (conn.pageId === pageId) {
          this.#terminateDebuggerConnection(
            WS_CLOSURE_CODE.NORMAL,
            WS_CLOSE_REASON.NEW_DEBUGGER_OPENED,
            sid,
          );
        }
      }
    }

    // Generate a unique session ID for this debugger connection using UUID
    // to minimize collision likelihood across device reconnections
    const sessionId = crypto.randomUUID();

    this.#deviceEventReporter?.logConnection('debugger', {
      pageId,
      frontendUserAgent: userAgent,
    });

    const debuggerInfo: DebuggerConnection = {
      socket,
      prependedFilePrefix: false,
      pageId,
      userAgent: userAgent,
      customHandler: null,
      debuggerRelativeBaseUrl,
      sessionId,
    };

    this.#debuggerConnections.set(sessionId, debuggerInfo);

    debug(
      `Got new debugger connection via ${debuggerRelativeBaseUrl.href} for ` +
        `page ${pageId} of ${this.#name} with sessionId ${sessionId}`,
    );

    if (this.#createCustomMessageHandler) {
      debuggerInfo.customHandler = this.#createCustomMessageHandler({
        page,
        debugger: {
          userAgent: debuggerInfo.userAgent,
          sendMessage: message => {
            try {
              const payload = JSON.stringify(message);
              this.#cdpDebugLogging.log('ProxyToDebugger', payload);
              socket.send(payload);
            } catch {}
          },
        },
        device: {
          appId: this.#app,
          id: this.#id,
          name: this.#name,
          sendMessage: message => {
            try {
              const payload = JSON.stringify({
                event: 'wrappedEvent',
                payload: {
                  pageId: this.#mapToDevicePageId(pageId),
                  wrappedEvent: JSON.stringify(message),
                  sessionId,
                },
              });
              this.#cdpDebugLogging.log('DebuggerToProxy', payload);
              this.#deviceSocket.send(payload);
            } catch {}
          },
        },
      });

      if (debuggerInfo.customHandler) {
        debug('Created new custom message handler for debugger connection');
      } else {
        debug(
          'Skipping new custom message handler for debugger connection, factory function returned null',
        );
      }
    }

    this.#sendConnectEventToDevice(this.#mapToDevicePageId(pageId), sessionId);

    // $FlowFixMe[incompatible-type]
    socket.on('message', (message: string) => {
      this.#cdpDebugLogging.log('DebuggerToProxy', message);
      const debuggerRequest = JSON.parse(message);
      this.#deviceEventReporter?.logRequest(debuggerRequest, 'debugger', {
        pageId: debuggerInfo.pageId,
        frontendUserAgent: userAgent,
      });
      let processedReq = debuggerRequest;

      if (
        debuggerInfo.customHandler?.handleDebuggerMessage(debuggerRequest) ===
        true
      ) {
        return;
      }

      if (!this.#pageHasCapability(page, 'nativeSourceCodeFetching')) {
        processedReq = this.#interceptClientMessageForSourceFetching(
          debuggerRequest,
          debuggerInfo,
          socket,
        );
      }

      if (processedReq) {
        this.#sendMessageToDevice({
          event: 'wrappedEvent',
          payload: {
            pageId: this.#mapToDevicePageId(pageId),
            wrappedEvent: JSON.stringify(processedReq),
            sessionId,
          },
        });
      }
    });
    socket.on('close', () => {
      debug(
        `Debugger for page ${pageId} and ${this.#name} disconnected (sessionId: ${sessionId}).`,
      );
      this.#deviceEventReporter?.logDisconnection('debugger');
      this.#terminateDebuggerConnection(undefined, undefined, sessionId);
    });

    const cdpDebugLogging = this.#cdpDebugLogging;
    // $FlowFixMe[method-unbinding]
    const sendFunc = socket.send;
    // $FlowFixMe[cannot-write]
    socket.send = function (message: string) {
      cdpDebugLogging.log('ProxyToDebugger', message);
      return sendFunc.call(socket, message);
    };
  }

  #sendConnectEventToDevice(devicePageId: string, sessionId: string) {
    this.#sendMessageToDevice({
      event: 'connect',
      payload: {pageId: devicePageId, sessionId},
    });
  }

  #sendDisconnectEventToDevice(devicePageId: string, sessionId: string) {
    this.#sendMessageToDevice({
      event: 'disconnect',
      payload: {pageId: devicePageId, sessionId},
    });
  }

  /**
   * Returns `true` if a page supports the given target capability flag.
   */
  #pageHasCapability(page: Page, flag: keyof TargetCapabilityFlags): boolean {
    return page.capabilities[flag] === true;
  }

  /**
   * Returns the synthetic "React Native Experimental (Improved Chrome Reloads)" page.
   */
  #createSyntheticPage(): Page {
    return {
      id: REACT_NATIVE_RELOADABLE_PAGE_ID,
      title: 'React Native Experimental (Improved Chrome Reloads)',
      vm: "don't use",
      app: this.#app,
      capabilities: {},
    };
  }

  // Handles messages received from device:
  // 1. For getPages responses updates local #pages list.
  // 2. All other messages are forwarded to debugger as wrappedEvent.
  //
  // In the future more logic will be added to this method for modifying
  // some of the messages (like updating messages with source maps and file
  // locations).
  #handleMessageFromDevice(message: MessageFromDevice) {
    if (message.event === 'getPages') {
      // Preserve ordering - getPages guarantees addition order.
      const shouldDisableMultipleDebuggers =
        !this.#experiments.enableStandaloneFuseboxShell;
      this.#pages = new Map(
        message.payload.map(({capabilities: rawCapabilities, ...page}) => {
          const capabilities: TargetCapabilityFlags =
            shouldDisableMultipleDebuggers
              ? {...(rawCapabilities ?? {}), supportsMultipleDebuggers: false}
              : (rawCapabilities ?? {});
          return [
            page.id,
            {
              ...page,
              capabilities,
            },
          ];
        }),
      );

      if (message.payload.length !== this.#pages.size) {
        const duplicateIds = new Set<string>();
        const idsSeen = new Set<string>();
        for (const page of message.payload) {
          if (!idsSeen.has(page.id)) {
            idsSeen.add(page.id);
          } else {
            duplicateIds.add(page.id);
          }
        }
        debug(
          `Received duplicate page IDs from device: ${[...duplicateIds].join(
            ', ',
          )}`,
        );
      }

      // Check if device has a new legacy React Native page.
      // There is usually no more than 2-3 pages per device so this operation
      // is not expensive.
      // TODO(hypuk): It is better for VM to send update event when new page is
      // created instead of manually checking this on every getPages result.
      for (const page of this.#pages.values()) {
        if (this.#pageHasCapability(page, 'nativePageReloads')) {
          continue;
        }

        if (page.title.includes('React')) {
          if (page.id !== this.#lastConnectedLegacyReactNativePage?.id) {
            this.#newLegacyReactNativePage(page);
            break;
          }
        }
      }
    } else if (message.event === 'disconnect') {
      // Device sends disconnect events only when page is reloaded or
      // if debugger socket was disconnected.
      const pageId = message.payload.pageId;
      const sessionId = message.payload.sessionId;

      // TODO(moti): Handle null case explicitly, e.g. swallow disconnect events
      // for unknown pages.
      const page: ?Page = this.#pages.get(pageId);

      if (page != null && this.#pageHasCapability(page, 'nativePageReloads')) {
        return;
      }

      // Find the debugger connection(s) for this page
      if (sessionId != null) {
        // Disconnect specific session
        const debuggerConnection = this.#debuggerConnections.get(sessionId);
        if (
          debuggerConnection &&
          debuggerConnection.socket.readyState === WS.OPEN
        ) {
          if (debuggerConnection.pageId !== REACT_NATIVE_RELOADABLE_PAGE_ID) {
            debug(
              `Legacy page ${pageId} is reloading (sessionId: ${sessionId}).`,
            );
            debuggerConnection.socket.send(JSON.stringify({method: 'reload'}));
          }
        }
      } else {
        // Legacy mode: send to all connected debuggers for this page
        for (const debuggerConnection of this.#debuggerConnections.values()) {
          if (
            debuggerConnection.pageId !== REACT_NATIVE_RELOADABLE_PAGE_ID &&
            debuggerConnection.socket.readyState === WS.OPEN
          ) {
            debug(`Legacy page ${pageId} is reloading.`);
            debuggerConnection.socket.send(JSON.stringify({method: 'reload'}));
          }
        }
      }
    } else if (message.event === 'wrappedEvent') {
      const sessionId = message.payload.sessionId;

      // Route message to the correct debugger connection by sessionId
      let debuggerConnection: ?DebuggerConnection = null;
      if (sessionId != null) {
        debuggerConnection = this.#debuggerConnections.get(sessionId);
      } else {
        // Legacy mode: route to the first (and only) debugger connection
        // ASSERT: In legacy mode, there should be at most one debugger connected.
        if (this.#debuggerConnections.size > 1) {
          debug(
            'WARNING: Device sent message without sessionId but multiple debuggers are connected. ' +
              'This indicates a device/proxy version mismatch.',
          );
        }
        debuggerConnection =
          this.#debuggerConnections.values().next().value ?? null;
      }

      if (debuggerConnection == null) {
        return;
      }

      const debuggerSocket = debuggerConnection.socket;
      if (debuggerSocket == null || debuggerSocket.readyState !== WS.OPEN) {
        // TODO(hypuk): Send error back to device?
        return;
      }

      const parsedPayload = JSON.parse(message.payload.wrappedEvent);
      const pageId = debuggerConnection.pageId;
      if ('id' in parsedPayload) {
        this.#deviceEventReporter?.logResponse(parsedPayload, 'device', {
          pageId,
          frontendUserAgent: debuggerConnection.userAgent ?? null,
        });
      }

      if (
        debuggerConnection.customHandler?.handleDeviceMessage(parsedPayload) ===
        true
      ) {
        return;
      }

      this.#processMessageFromDeviceLegacy(
        parsedPayload,
        debuggerConnection,
        pageId,
      );
      const messageToSend = JSON.stringify(parsedPayload);
      debuggerSocket.send(messageToSend);
    }
  }

  // Sends single message to device.
  #sendMessageToDevice(message: MessageToDevice) {
    try {
      const messageToSend = JSON.stringify(message);
      if (message.event !== 'getPages') {
        this.#cdpDebugLogging.log('ProxyToDevice', messageToSend);
      }
      this.#deviceSocket.send(messageToSend);
    } catch (error) {}
  }

  // We received new React Native Page ID.
  #newLegacyReactNativePage(page: Page) {
    debug(`React Native page updated to ${page.id}`);

    // Find the debugger connection that's connected to the reloadable page
    let reloadablePageDebugger: ?DebuggerConnection = null;
    for (const debuggerConnection of this.#debuggerConnections.values()) {
      if (debuggerConnection.pageId === REACT_NATIVE_RELOADABLE_PAGE_ID) {
        reloadablePageDebugger = debuggerConnection;
        break;
      }
    }

    if (reloadablePageDebugger == null) {
      // We can just remember new page ID without any further actions if no
      // debugger is currently attached or attached debugger is not
      // "Reloadable React Native" connection.
      this.#lastConnectedLegacyReactNativePage = page;
      return;
    }
    const oldPageId = this.#lastConnectedLegacyReactNativePage?.id;
    this.#lastConnectedLegacyReactNativePage = page;
    this.#isLegacyPageReloading = true;

    // We already had a debugger connected to React Native page and a
    // new one appeared - in this case we need to emulate execution context
    // detroy and resend Debugger.enable and Runtime.enable commands to new
    // page.

    if (oldPageId != null) {
      this.#sendDisconnectEventToDevice(
        oldPageId,
        reloadablePageDebugger.sessionId,
      );
    }

    this.#sendConnectEventToDevice(page.id, reloadablePageDebugger.sessionId);

    const toSend = [
      {method: 'Runtime.enable', id: 1e9},
      {method: 'Debugger.enable', id: 1e9},
    ];

    for (const message of toSend) {
      const pageId = reloadablePageDebugger.pageId;
      this.#deviceEventReporter?.logRequest(message, 'proxy', {
        pageId,
        frontendUserAgent: reloadablePageDebugger.userAgent ?? null,
      });
      this.#sendMessageToDevice({
        event: 'wrappedEvent',
        payload: {
          pageId: this.#mapToDevicePageId(page.id),
          wrappedEvent: JSON.stringify(message),
          sessionId: reloadablePageDebugger.sessionId,
        },
      });
    }
  }

  /**
   * Given a URL from the debugger frontend, returns the equivalent URL
   * reachable from the device.
   */
  #debuggerRelativeToDeviceRelativeUrl(
    debuggerRelativeUrl: URL,
    {debuggerRelativeBaseUrl}: DebuggerConnection,
  ): URL {
    const deviceRelativeUrl = new URL(debuggerRelativeUrl.href);
    if (debuggerRelativeUrl.origin === debuggerRelativeBaseUrl.origin) {
      deviceRelativeUrl.hostname = this.#deviceRelativeBaseUrl.hostname;
      deviceRelativeUrl.port = this.#deviceRelativeBaseUrl.port;
      deviceRelativeUrl.protocol = this.#deviceRelativeBaseUrl.protocol;
    }
    return deviceRelativeUrl;
  }

  /**
   * Given a URL from the device, returns the equivalent URL reachable from
   * the debugger frontend.
   */
  #deviceRelativeUrlToDebuggerRelativeUrl(
    deviceRelativeUrl: URL,
    {debuggerRelativeBaseUrl}: DebuggerConnection,
  ): URL {
    const debuggerRelativeUrl = new URL(deviceRelativeUrl.href);
    if (deviceRelativeUrl.origin === this.#deviceRelativeBaseUrl.origin) {
      debuggerRelativeUrl.hostname = debuggerRelativeBaseUrl.hostname;
      debuggerRelativeUrl.port = debuggerRelativeBaseUrl.port;
      debuggerRelativeUrl.protocol = debuggerRelativeUrl.protocol;
    }
    return debuggerRelativeUrl;
  }

  /**
   * Given a URL from the device, returns the equivalent URL reachable from
   * this proxy.
   */
  #deviceRelativeUrlToServerRelativeUrl(deviceRelativeUrl: URL): URL {
    const debuggerRelativeUrl = new URL(deviceRelativeUrl.href);
    if (deviceRelativeUrl.origin === this.#deviceRelativeBaseUrl.origin) {
      debuggerRelativeUrl.hostname = this.#serverRelativeBaseUrl.hostname;
      debuggerRelativeUrl.port = this.#serverRelativeBaseUrl.port;
      debuggerRelativeUrl.protocol = this.#serverRelativeBaseUrl.protocol;
    }
    return debuggerRelativeUrl;
  }

  // Allows to make changes in incoming message from device.
  #processMessageFromDeviceLegacy(
    payload: CDPServerMessage,
    debuggerInfo: DebuggerConnection,
    pageId: ?string,
  ) {
    // TODO(moti): Handle null case explicitly, or ideally associate a copy
    // of the page metadata object with the connection so this can never be
    // null.
    const page: ?Page = pageId != null ? this.#pages.get(pageId) : null;

    // Replace Android addresses for scriptParsed event.
    if (
      (!page || !this.#pageHasCapability(page, 'nativeSourceCodeFetching')) &&
      payload.method === 'Debugger.scriptParsed' &&
      payload.params != null
    ) {
      const params = payload.params;
      if ('sourceMapURL' in params) {
        const sourceMapURL = this.#tryParseHTTPURL(params.sourceMapURL);
        if (sourceMapURL) {
          // Rewrite device-relative URLs to de debugger-relative URLs for the
          // frontend.
          payload.params.sourceMapURL =
            this.#deviceRelativeUrlToDebuggerRelativeUrl(
              sourceMapURL,
              debuggerInfo,
            ).href;
        }
      }
      if ('url' in params) {
        let serverRelativeUrl = params.url;
        const parsedUrl = this.#tryParseHTTPURL(params.url);
        if (parsedUrl) {
          // Rewrite device-relative URLs pointing to the server so that they're
          // reachable from the frontend.
          payload.params.url = this.#deviceRelativeUrlToDebuggerRelativeUrl(
            parsedUrl,
            debuggerInfo,
          ).href;

          // Determine the server-relative URL.
          serverRelativeUrl =
            this.#deviceRelativeUrlToServerRelativeUrl(parsedUrl).href;
        }

        // Chrome doesn't download source maps if URL param is not a valid
        // URL. Some frameworks pass alphanumeric script ID instead of URL which causes
        // Chrome to not download source maps. In this case we want to prepend script ID
        // with 'file://' prefix.
        if (payload.params.url.match(/^[0-9a-z]+$/)) {
          payload.params.url = FILE_PREFIX + payload.params.url;
          debuggerInfo.prependedFilePrefix = true;
        }

        if ('scriptId' in params && params.scriptId != null) {
          // Set a server-relative URL to locally fetch source by script ID
          // on Debugger.getScriptSource.
          this.#scriptIdToSourcePathMapping.set(
            params.scriptId,
            serverRelativeUrl,
          );
        }
      }
    }

    if (
      /* $FlowFixMe[invalid-compare] Error discovered during Constant Condition
       * roll out. See https://fburl.com/workplace/4oq3zi07. */
      payload.method === 'Runtime.executionContextCreated' &&
      this.#isLegacyPageReloading
    ) {
      // The new context is ready. First notify Chrome that we've reloaded so
      // it'll resend its breakpoints. If we do this earlier, we may not be
      // ready to receive them.
      debuggerInfo.socket.send(
        JSON.stringify({method: 'Runtime.executionContextsCleared'}),
      );

      // The VM starts in a paused mode. Ask it to resume.
      // Note that if setting breakpoints in early initialization functions,
      // there's a currently race condition between these functions executing
      // and Chrome re-applying the breakpoints due to the message above.
      //
      // This is not an issue in VSCode/Nuclide where the IDE knows to resume
      // at its convenience.
      const resumeMessage = {method: 'Debugger.resume', id: 0};
      this.#deviceEventReporter?.logRequest(resumeMessage, 'proxy', {
        pageId: debuggerInfo.pageId,
        frontendUserAgent: debuggerInfo.userAgent ?? null,
      });
      this.#sendMessageToDevice({
        event: 'wrappedEvent',
        payload: {
          pageId: this.#mapToDevicePageId(debuggerInfo.pageId),
          wrappedEvent: JSON.stringify(resumeMessage),
          sessionId: debuggerInfo.sessionId,
        },
      });

      this.#isLegacyPageReloading = false;
    }

    if (payload.method === 'Runtime.consoleAPICalled') {
      const callFrames = payload.params?.stackTrace?.callFrames ?? [];
      for (const callFrame of callFrames) {
        if (callFrame.url) {
          const parsedUrl = this.#tryParseHTTPURL(callFrame.url);
          if (parsedUrl) {
            // Rewrite device-relative URLs pointing to the server so that they're
            // reachable from the frontend.
            callFrame.url = this.#deviceRelativeUrlToDebuggerRelativeUrl(
              parsedUrl,
              debuggerInfo,
            ).href;
          }
        }
      }
    }
  }

  /**
   * Intercept an incoming message from a connected debugger. Returns either an
   * original/replacement CDP message object, or `null` (will forward nothing
   * to the target).
   */
  #interceptClientMessageForSourceFetching(
    req: CDPClientMessage,
    debuggerInfo: DebuggerConnection,
    socket: WS,
  ): CDPClientMessage | null {
    switch (req.method) {
      case 'Debugger.setBreakpointByUrl':
        return this.#processDebuggerSetBreakpointByUrl(req, debuggerInfo);
      case 'Debugger.getScriptSource':
        // Sends response to debugger via side-effect
        void this.#processDebuggerGetScriptSource(req, socket, debuggerInfo);
        return null;
      case 'Network.loadNetworkResource':
        // If we're rewriting URLs (to frontend-relative), we don't want to
        // pass these URLs to the device, since it may try to fetch, return a
        // CDP *result* (not error) with a network failure, and CDT
        // will *not* then fall back to fetching locally.
        //
        // Instead, take the absence of a nativeSourceCodeFetching
        // capability as a signal to never pass a loadNetworkResource request
        // to the device. By returning a CDP error, the frontend should fetch.
        const result = {
          error: {
            code: -32601, // Method not found
            message:
              '[inspector-proxy]: Page lacks nativeSourceCodeFetching capability.',
          },
        };
        const response = {id: req.id, result};
        socket.send(JSON.stringify(response));
        const pageId = debuggerInfo.pageId;
        this.#deviceEventReporter?.logResponse(response, 'proxy', {
          pageId,
          frontendUserAgent: debuggerInfo.userAgent ?? null,
        });
        return null;
      default:
        return req;
    }
  }

  #processDebuggerSetBreakpointByUrl(
    req: CDPRequest<'Debugger.setBreakpointByUrl'>,
    debuggerInfo: DebuggerConnection,
  ): CDPRequest<'Debugger.setBreakpointByUrl'> {
    // If we replaced Android emulator's address to localhost we need to change it back.
    const {debuggerRelativeBaseUrl, prependedFilePrefix} = debuggerInfo;

    const processedReq = {...req, params: {...req.params}};
    if (processedReq.params.url != null) {
      const originalUrlParam = processedReq.params.url;
      const httpUrl = this.#tryParseHTTPURL(originalUrlParam);
      if (httpUrl) {
        processedReq.params.url = this.#debuggerRelativeToDeviceRelativeUrl(
          httpUrl,
          debuggerInfo,
        ).href;
      } else if (
        originalUrlParam.startsWith(FILE_PREFIX) &&
        prependedFilePrefix
      ) {
        // Remove fake URL prefix if we modified URL in #processMessageFromDeviceLegacy.
        processedReq.params.url = originalUrlParam.slice(FILE_PREFIX.length);
      }
    }

    // Retain special case rewriting of localhost to device-relative IPs
    // within regex patterns. We don't rewrite the protocol here because
    // these patterns typically come from CDT reinterpreting the source URL
    // `file://host/path` into the regex `host/path|file://host/path`. See:
    //
    // https://github.com/ChromeDevTools/devtools-frontend/blob/f913cc6d76f2e2639c05b11ba673fc880b5490dd/front_end/core/sdk/DebuggerModel.ts#L505
    //
    // This has always been fragile and probably unnecessary - we don't set
    // `file://` source URLs. It can be removed when we drop support for
    // legacy targets, if not sooner.
    if (
      // Android's stock emulator and other emulators such as genymotion use a
      // standard localhost alias.
      new Set(['10.0.2.2', '10.0.3.2']).has(
        this.#deviceRelativeBaseUrl.hostname,
      ) &&
      debuggerRelativeBaseUrl.hostname === 'localhost' &&
      processedReq.params.urlRegex != null
    ) {
      processedReq.params.urlRegex = processedReq.params.urlRegex.replaceAll(
        'localhost',
        // regex-escape IPv4
        this.#deviceRelativeBaseUrl.hostname.replaceAll('.', '\\.'),
      );
    }
    return processedReq;
  }

  async #processDebuggerGetScriptSource(
    req: CDPRequest<'Debugger.getScriptSource'>,
    socket: WS,
    debuggerInfo: DebuggerConnection,
  ): Promise<void> {
    const sendSuccessResponse = (scriptSource: string) => {
      const result: {
        scriptSource: string,
        bytecode?: string,
      } = {scriptSource};
      const response: CDPResponse<'Debugger.getScriptSource'> = {
        id: req.id,
        result,
      };
      socket.send(JSON.stringify(response));
      const pageId = debuggerInfo.pageId;
      this.#deviceEventReporter?.logResponse(response, 'proxy', {
        pageId,
        frontendUserAgent: debuggerInfo.userAgent ?? null,
      });
    };
    const sendErrorResponse = (error: string) => {
      // Tell the client that the request failed
      const result = {error: {message: error}};
      const response = {id: req.id, result};
      socket.send(JSON.stringify(response));

      // Send to the console as well, so the user can see it
      this.#sendErrorToDebugger(error, debuggerInfo);
      const pageId = debuggerInfo.pageId;
      this.#deviceEventReporter?.logResponse(response, 'proxy', {
        pageId,
        frontendUserAgent: debuggerInfo.userAgent ?? null,
      });
    };

    const pathToSource = this.#scriptIdToSourcePathMapping.get(
      req.params.scriptId,
    );

    try {
      const httpURL =
        pathToSource == null ? null : this.#tryParseHTTPURL(pathToSource);
      if (!httpURL) {
        throw new Error(
          `Can't parse requested URL ${pathToSource === undefined ? 'undefined' : JSON.stringify(pathToSource)}`,
        );
      }

      const text = await this.#fetchText(httpURL);

      sendSuccessResponse(text);
    } catch (err) {
      sendErrorResponse(
        `Failed to fetch source url ${pathToSource === undefined ? 'undefined' : JSON.stringify(pathToSource)} for scriptId ${req.params.scriptId}: ${err.message}`,
      );
    }
  }

  #mapToDevicePageId(pageId: string): string {
    if (
      pageId === REACT_NATIVE_RELOADABLE_PAGE_ID &&
      this.#lastConnectedLegacyReactNativePage != null
    ) {
      return this.#lastConnectedLegacyReactNativePage.id;
    } else {
      return pageId;
    }
  }

  #tryParseHTTPURL(url: string): ?URL {
    let parsedURL: ?URL;
    try {
      parsedURL = new URL(url);
    } catch {}

    const protocol = parsedURL?.protocol;
    if (protocol !== 'http:' && protocol !== 'https:') {
      parsedURL = undefined;
    }

    return parsedURL;
  }

  // Fetch text, raising an exception if the text could not be fetched,
  // or is too large.
  async #fetchText(url: URL): Promise<string> {
    // $FlowFixMe[incompatible-call] Suppress arvr node-fetch flow error
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ' ' + response.statusText);
    }
    const text = await response.text();
    // Restrict the length to well below the 500MB limit for nodejs (leaving
    // room some some later manipulation, e.g. base64 or wrapping in JSON)
    if (text.length > 350000000) {
      throw new Error('file too large to fetch via HTTP');
    }
    return text;
  }

  #sendErrorToDebugger(message: string, debuggerInfo?: DebuggerConnection) {
    const debuggerSocket = debuggerInfo?.socket;
    if (debuggerSocket && debuggerSocket.readyState === WS.OPEN) {
      debuggerSocket.send(
        JSON.stringify({
          method: 'Runtime.consoleAPICalled',
          params: {
            args: [
              {
                type: 'string',
                value: message,
              },
            ],
            executionContextId: 0,
            type: 'error',
          },
        }),
      );
    }
  }

  dangerouslyGetSocket(): WS {
    return this.#deviceSocket;
  }
}
