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
import invariant from 'invariant';
import crypto from 'node:crypto';
import WS from 'ws';

const debug = require('debug')('Metro:InspectorProxy');

const PAGES_POLLING_INTERVAL = 1000;

const WS_CLOSURE_CODE = {
  NORMAL: 1000,
  INTERNAL_ERROR: 1011,
};

export const WS_CLOSE_REASON = {
  PAGE_NOT_FOUND: '[PAGE_NOT_FOUND] Debugger page not found',
  CONNECTION_LOST: '[CONNECTION_LOST] Connection lost to corresponding device',
  RECREATING_DEVICE: '[RECREATING_DEVICE] Recreating device connection',
  NEW_DEBUGGER_OPENED:
    '[NEW_DEBUGGER_OPENED] New debugger opened for the same app instance',
};

const FILE_PREFIX = 'file://';

type DebuggerConnection = {
  socket: WS,
  prependedFilePrefix: boolean,
  pageId: string,
  userAgent: string | null,
  customHandler: ?CustomMessageHandler,
  debuggerRelativeBaseUrl: ReadonlyURL,
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

export default class Device {
  #id: string;
  #name: string;
  #app: string;
  #deviceSocket: WS;
  #pages: ReadonlyMap<string, Page> = new Map();
  #debuggerConnections: Map<string, DebuggerConnection> = new Map();
  #lastConnectedLegacyReactNativePage: ?Page = null;
  #isLegacyPageReloading: boolean = false;
  #lastGetPagesMessage: string = '';
  #scriptIdToSourcePathMapping: Map<string, string> = new Map();
  #deviceEventReporter: ?DeviceEventReporter;
  #pagesPollingIntervalId: ReturnType<typeof setInterval>;
  #createCustomMessageHandler: ?CreateCustomMessageHandlerFn;
  #deviceRelativeBaseUrl: ReadonlyURL;
  #serverRelativeBaseUrl: ReadonlyURL;
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

    this.#deviceSocket.on('message', (message: string) => {
      try {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.event === 'getPages') {
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

    this.#pagesPollingIntervalId = setInterval(
      () => this.#sendMessageToDevice({event: 'getPages'}),
      PAGES_POLLING_INTERVAL,
    );
    this.#deviceSocket.on('close', () => {
      if (socket === this.#deviceSocket) {
        this.#deviceEventReporter?.logDisconnection('device');
        this.#terminateDebuggerConnection(
          WS_CLOSURE_CODE.NORMAL,
          WS_CLOSE_REASON.CONNECTION_LOST,
        );
        clearInterval(this.#pagesPollingIntervalId);
      }
    });
  }

  #terminateDebuggerConnection(
    code?: number,
    reason?: string,
    sessionId?: string,
  ) {
    if (sessionId != null) {
      const debuggerConnection = this.#debuggerConnections.get(sessionId);
      if (debuggerConnection) {
        this.#debuggerConnections.delete(sessionId);
        this.#sendDisconnectEventToDevice(
          this.#mapToDevicePageId(debuggerConnection.pageId),
          sessionId,
        );
        debuggerConnection.socket.close(code, reason);
      }
    } else {
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

  dangerouslyRecreateDevice(deviceOptions: DeviceOptions) {
    invariant(
      deviceOptions.id === this.#id,
      'dangerouslyRecreateDevice() can only be used for the same device ID',
    );

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

    if (oldDebuggerConnections.size > 0) {
      this.#deviceSocket.close(
        WS_CLOSURE_CODE.NORMAL,
        WS_CLOSE_REASON.RECREATING_DEVICE,
      );
    }

    this.#dangerouslyConstruct(deviceOptions);

    for (const oldDebugger of oldDebuggerConnections.values()) {
      oldDebugger.socket.removeAllListeners();
      this.handleDebuggerConnection(oldDebugger.socket, oldDebugger.pageId, {
        debuggerRelativeBaseUrl: oldDebugger.debuggerRelativeBaseUrl,
        userAgent: oldDebugger.userAgent,
      });
    }
  }

  getName(): string { return this.#name; }
  getApp(): string { return this.#app; }

  getPagesList(): ReadonlyArray<Page> {
    if (this.#lastConnectedLegacyReactNativePage) {
      return [...this.#pages.values(), this.#createSyntheticPage()];
    } else {
      return [...this.#pages.values()];
    }
  }

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

    this.#deviceEventReporter?.logDisconnection('debugger');

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
    }

    this.#sendConnectEventToDevice(this.#mapToDevicePageId(pageId), sessionId);

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
    const sendFunc = socket.send;
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

  #pageHasCapability(page: Page, flag: keyof TargetCapabilityFlags): boolean {
    return page.capabilities[flag] === true;
  }

  #createSyntheticPage(): Page {
    return {
      id: REACT_NATIVE_RELOADABLE_PAGE_ID,
      title: 'React Native Experimental (Improved Chrome Reloads)',
      vm: "don't use",
      app: this.#app,
      capabilities: {},
    };
  }

  #handleMessageFromDevice(message: MessageFromDevice) {
    if (message.event === 'getPages') {
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
      const pageId = message.payload.pageId;
      const sessionId = message.payload.sessionId;
      const page: ?Page = this.#pages.get(pageId);

      if (page != null && this.#pageHasCapability(page, 'nativePageReloads')) {
        return;
      }

      if (sessionId != null) {
        const debuggerConnection = this.#debuggerConnections.get(sessionId);
        if (
          debuggerConnection &&
          debuggerConnection.socket.readyState === WS.OPEN
        ) {
          if (debuggerConnection.pageId !== REACT_NATIVE_RELOADABLE_PAGE_ID) {
            debuggerConnection.socket.send(JSON.stringify({method: 'reload'}));
          }
        }
      } else {
        for (const debuggerConnection of this.#debuggerConnections.values()) {
          if (
            debuggerConnection.pageId !== REACT_NATIVE_RELOADABLE_PAGE_ID &&
            debuggerConnection.socket.readyState === WS.OPEN
          ) {
            debuggerConnection.socket.send(JSON.stringify({method: 'reload'}));
          }
        }
      }
    } else if (message.event === 'wrappedEvent') {
      const sessionId = message.payload.sessionId;
      let debuggerConnection: ?DebuggerConnection = null;
      if (sessionId != null) {
        debuggerConnection = this.#debuggerConnections.get(sessionId);
      } else {
        debuggerConnection =
          this.#debuggerConnections.values().next().value ?? null;
      }

      if (debuggerConnection == null) {
        return;
      }

      const debuggerSocket = debuggerConnection.socket;
      if (debuggerSocket == null || debuggerSocket.readyState !== WS.OPEN) {
        return;
      }

      const parsedPayload = JSON.parse(message.payload.wrappedEvent);
      if ('id' in parsedPayload) {
        this.#deviceEventReporter?.logResponse(parsedPayload, 'device', {
          pageId: debuggerConnection.pageId,
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
        debuggerConnection.pageId,
      );
      debuggerSocket.send(JSON.stringify(parsedPayload));
    }
  }

  #sendMessageToDevice(message: MessageToDevice) {
    try {
      const messageToSend = JSON.stringify(message);
      this.#deviceSocket.send(messageToSend);
    } catch (error) {}
  }

  #newLegacyReactNativePage(page: Page) {
    let reloadablePageDebugger: ?DebuggerConnection = null;
    for (const debuggerConnection of this.#debuggerConnections.values()) {
      if (debuggerConnection.pageId === REACT_NATIVE_RELOADABLE_PAGE_ID) {
        reloadablePageDebugger = debuggerConnection;
        break;
      }
    }

    if (reloadablePageDebugger == null) {
      this.#lastConnectedLegacyReactNativePage = page;
      return;
    }
    const oldPageId = this.#lastConnectedLegacyReactNativePage?.id;
    this.#lastConnectedLegacyReactNativePage = page;
    this.#isLegacyPageReloading = true;

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

  #deviceRelativeUrlToDebuggerRelativeUrl(
    deviceRelativeUrl: URL,
    {debuggerRelativeBaseUrl}: DebuggerConnection,
  ): URL {
    const debuggerRelativeUrl = new URL(deviceRelativeUrl.href);
    if (deviceRelativeUrl.origin === this.#deviceRelativeBaseUrl.origin) {
      debuggerRelativeUrl.hostname = debuggerRelativeBaseUrl.hostname;
      debuggerRelativeUrl.port = debuggerRelativeBaseUrl.port;
      // ফিক্সটি এখানে:
      debuggerRelativeUrl.protocol = debuggerRelativeBaseUrl.protocol;
    }
    return debuggerRelativeUrl;
  }

  #deviceRelativeUrlToServerRelativeUrl(deviceRelativeUrl: URL): URL {
    const debuggerRelativeUrl = new URL(deviceRelativeUrl.href);
    if (deviceRelativeUrl.origin === this.#deviceRelativeBaseUrl.origin) {
      debuggerRelativeUrl.hostname = this.#serverRelativeBaseUrl.hostname;
      debuggerRelativeUrl.port = this.#serverRelativeBaseUrl.port;
      debuggerRelativeUrl.protocol = this.#serverRelativeBaseUrl.protocol;
    }
    return debuggerRelativeUrl;
  }

  #processMessageFromDeviceLegacy(
    payload: CDPServerMessage,
    debuggerInfo: DebuggerConnection,
    pageId: ?string,
  ) {
    const page: ?Page = pageId != null ? this.#pages.get(pageId) : null;

    if (
      (!page || !this.#pageHasCapability(page, 'nativeSourceCodeFetching')) &&
      payload.method === 'Debugger.scriptParsed' &&
      payload.params != null
    ) {
      const params = payload.params;
      if ('sourceMapURL' in params) {
        const sourceMapURL = this.#tryParseHTTPURL(params.sourceMapURL);
        if (sourceMapURL) {
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
          payload.params.url = this.#deviceRelativeUrlToDebuggerRelativeUrl(
            parsedUrl,
            debuggerInfo,
          ).href;
          serverRelativeUrl =
            this.#deviceRelativeUrlToServerRelativeUrl(parsedUrl).href;
        }
        if (payload.params.url.match(/^[0-9a-z]+$/)) {
          payload.params.url = FILE_PREFIX + payload.params.url;
          debuggerInfo.prependedFilePrefix = true;
        }
        if ('scriptId' in params && params.scriptId != null) {
          this.#scriptIdToSourcePathMapping.set(
            params.scriptId,
            serverRelativeUrl,
          );
        }
      }
    }

    if (
      payload.method === 'Runtime.executionContextCreated' &&
      this.#isLegacyPageReloading
    ) {
      debuggerInfo.socket.send(
        JSON.stringify({method: 'Runtime.executionContextsCleared'}),
      );
      const resumeMessage = {method: 'Debugger.resume', id: 0};
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
  }

  #interceptClientMessageForSourceFetching(
    req: CDPClientMessage,
    debuggerInfo: DebuggerConnection,
    socket: WS,
  ): CDPClientMessage | null {
    switch (req.method) {
      case 'Debugger.setBreakpointByUrl':
        return this.#processDebuggerSetBreakpointByUrl(req, debuggerInfo);
      case 'Debugger.getScriptSource':
        void this.#processDebuggerGetScriptSource(req, socket, debuggerInfo);
        return null;
      case 'Network.loadNetworkResource':
        const result = {
          error: {
            code: -32601,
            message:
              '[inspector-proxy]: Page lacks nativeSourceCodeFetching capability.',
          },
        };
        const response = {id: req.id, result};
        socket.send(JSON.stringify(response));
        return null;
      default:
        return req;
    }
  }

  #processDebuggerSetBreakpointByUrl(
    req: CDPRequest<'Debugger.setBreakpointByUrl'>,
    debuggerInfo: DebuggerConnection,
  ): CDPRequest<'Debugger.setBreakpointByUrl'> {
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
        processedReq.params.url = originalUrlParam.slice(FILE_PREFIX.length);
      }
    }
    if (
      new Set(['10.0.2.2', '10.0.3.2']).has(
        this.#deviceRelativeBaseUrl.hostname,
      ) &&
      debuggerRelativeBaseUrl.hostname === 'localhost' &&
      processedReq.params.urlRegex != null
    ) {
      processedReq.params.urlRegex = processedReq.params.urlRegex.replaceAll(
        'localhost',
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
      socket.send(JSON.stringify({id: req.id, result: {scriptSource}}));
    };
    const sendErrorResponse = (error: string) => {
      socket.send(JSON.stringify({id: req.id, result: {error: {message: error}}}));
    };

    const pathToSource = this.#scriptIdToSourcePathMapping.get(
      req.params.scriptId,
    );

    try {
      const httpURL =
        pathToSource == null ? null : this.#tryParseHTTPURL(pathToSource);
      if (!httpURL) {
        throw new Error(`Can't parse requested URL`);
      }
      const text = await this.#fetchText(httpURL);
      sendSuccessResponse(text);
    } catch (err) {
      sendErrorResponse(`Failed to fetch source: ${err.message}`);
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
    try { parsedURL = new URL(url); } catch {}
    const protocol = parsedURL?.protocol;
    if (protocol !== 'http:' && protocol !== 'https:') { parsedURL = undefined; }
    return parsedURL;
  }

  async #fetchText(url: URL): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) { throw new Error('HTTP ' + response.status); }
    const text = await response.text();
    if (text.length > 350000000) { throw new Error('file too large'); }
    return text;
  }

  dangerouslyGetSocket(): WS { return this.#deviceSocket; }
}
