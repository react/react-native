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
import type {CDPResponse} from './cdp-types/messages';
import type {DeepReadOnly} from './types';

import TTLCache from '@isaacs/ttlcache';

type PendingCommand = {
  method: string,
  requestOrigin: 'proxy' | 'debugger',
  requestTime: number,
  metadata: RequestMetadata,
};

type DeviceMetadata = Readonly<{
  appId: string,
  deviceId: string,
  deviceName: string,
}>;

type RequestMetadata = Readonly<{
  pageId: string | null,
  frontendUserAgent: string | null,
}>;

type ResponseMetadata = Readonly<{
  pageId: string | null,
  frontendUserAgent: string | null,
}>;

class DeviceEventReporter {
  #eventReporter: EventReporter;

  #pendingCommands: TTLCache<number, PendingCommand> = new TTLCache({
    ttl: 10000,
    dispose: (
      command: PendingCommand,
      id: number,
      reason: 'evict' | 'set' | 'delete' | 'stale',
    ) => {
      if (reason === 'delete' || reason === 'set') {
        // TODO: Report clobbering ('set') using a dedicated error code
        return;
      }
      this.#logExpiredCommand(command);
    },
  });

  #metadata: DeviceMetadata;

  #deviceConnectedTimestamp: number;

  constructor(eventReporter: EventReporter, metadata: DeviceMetadata) {
    this.#eventReporter = eventReporter;
    this.#metadata = metadata;
    this.#deviceConnectedTimestamp = Date.now();
  }

  logRequest(
    req: Readonly<{id: number, method: string, ...}>,
    origin: 'debugger' | 'proxy',
    metadata: RequestMetadata,
  ): void {
    this.#pendingCommands.set(req.id, {
      method: req.method,
      requestOrigin: origin,
      requestTime: Date.now(),
      metadata,
    });
  }

  logResponse(
    res: DeepReadOnly<CDPResponse<>>,
    origin: 'device' | 'proxy',
    metadata: ResponseMetadata,
  ): void {
    const pendingCommand = this.#pendingCommands.get(res.id);
    if (!pendingCommand) {
      this.#eventReporter.logEvent({
        type: 'debugger_command',
        protocol: 'CDP',
        requestOrigin: null,
        method: null,
        status: 'coded_error',
        errorCode: 'UNMATCHED_REQUEST_ID',
        responseOrigin: 'proxy',
        timeSinceStart: null,
        appId: this.#metadata.appId,
        deviceId: this.#metadata.deviceId,
        deviceName: this.#metadata.deviceName,
        pageId: metadata.pageId,
        frontendUserAgent: metadata.frontendUserAgent,
        connectionUptime: this.#deviceConnectedTimestamp - Date.now(),
      });
      return;
    }
    const timeSinceStart = Date.now() - pendingCommand.requestTime;
    this.#pendingCommands.delete(res.id);
    if (res.error) {
      let {message} = res.error;
      if ('data' in res.error) {
        message += ` (${String(res.error.data)})`;
      }
      this.#eventReporter.logEvent({
        type: 'debugger_command',
        requestOrigin: pendingCommand.requestOrigin,
        method: pendingCommand.method,
        protocol: 'CDP',
        status: 'coded_error',
        errorCode: 'PROTOCOL_ERROR',
        errorDetails: message,
        responseOrigin: origin,
        timeSinceStart,
        appId: this.#metadata.appId,
        deviceId: this.#metadata.deviceId,
        deviceName: this.#metadata.deviceName,
        pageId: pendingCommand.metadata.pageId,
        frontendUserAgent: pendingCommand.metadata.frontendUserAgent,
        connectionUptime: this.#deviceConnectedTimestamp - Date.now(),
      });
      return;
    }
    this.#eventReporter.logEvent({
      type: 'debugger_command',
      protocol: 'CDP',
      requestOrigin: pendingCommand.requestOrigin,
      method: pendingCommand.method,
      status: 'success',
      responseOrigin: origin,
      timeSinceStart,
      appId: this.#metadata.appId,
      deviceId: this.#metadata.deviceId,
      deviceName: this.#metadata.deviceName,
      pageId: pendingCommand.metadata.pageId,
      frontendUserAgent: pendingCommand.metadata.frontendUserAgent,
      connectionUptime: this.#deviceConnectedTimestamp - Date.now(),
    });
  }

  logProfilingTargetRegistered() {
    this.#eventReporter.logEvent({
      type: 'profiling_target_registered',
      status: 'success',
      appId: this.#metadata.appId,
      deviceName: this.#metadata.deviceName,
      deviceId: this.#metadata.deviceId,
      pageId: null,
    });
  }

  logConnection(
    connectedEntity: 'debugger',
    metadata: Readonly<{
      pageId: string,
      frontendUserAgent: string | null,
    }>,
  ) {
    this.#eventReporter.logEvent({
      type: 'connect_debugger_frontend',
      status: 'success',
      appId: this.#metadata.appId,
      deviceName: this.#metadata.deviceName,
      deviceId: this.#metadata.deviceId,
      pageId: metadata.pageId,
      frontendUserAgent: metadata.frontendUserAgent,
    });
  }

  logDisconnection(disconnectedEntity: 'device' | 'debugger') {
    const eventReporter = this.#eventReporter;
    if (!eventReporter) {
      return;
    }
    const errorCode =
      disconnectedEntity === 'device'
        ? 'DEVICE_DISCONNECTED'
        : 'DEBUGGER_DISCONNECTED';
    for (const pendingCommand of this.#pendingCommands.values()) {
      this.#eventReporter.logEvent({
        type: 'debugger_command',
        protocol: 'CDP',
        requestOrigin: pendingCommand.requestOrigin,
        method: pendingCommand.method,
        status: 'coded_error',
        errorCode,
        responseOrigin: 'proxy',
        timeSinceStart: Date.now() - pendingCommand.requestTime,
        appId: this.#metadata.appId,
        deviceId: this.#metadata.deviceId,
        deviceName: this.#metadata.deviceName,
        pageId: pendingCommand.metadata.pageId,
        frontendUserAgent: pendingCommand.metadata.frontendUserAgent,
        connectionUptime: this.#deviceConnectedTimestamp - Date.now(),
      });
    }
    this.#pendingCommands.clear();
  }

  logProxyMessageHandlingError(
    messageOrigin: 'device' | 'debugger',
    error: Error,
    message: string,
  ): void {
    this.#eventReporter.logEvent({
      type: 'proxy_error',
      status: 'error',
      messageOrigin,
      message,
      error: error.message,
      errorStack: error.stack,
      appId: this.#metadata.appId,
      deviceId: this.#metadata.deviceId,
      deviceName: this.#metadata.deviceName,
      pageId: null,
      connectionUptime: this.#deviceConnectedTimestamp - Date.now(),
    });
  }

  #logExpiredCommand(pendingCommand: PendingCommand): void {
    this.#eventReporter.logEvent({
      type: 'debugger_command',
      protocol: 'CDP',
      requestOrigin: pendingCommand.requestOrigin,
      method: pendingCommand.method,
      status: 'coded_error',
      errorCode: 'TIMED_OUT',
      responseOrigin: 'proxy',
      timeSinceStart: Date.now() - pendingCommand.requestTime,
      appId: this.#metadata.appId,
      deviceId: this.#metadata.deviceId,
      deviceName: this.#metadata.deviceName,
      pageId: pendingCommand.metadata.pageId,
      frontendUserAgent: pendingCommand.metadata.frontendUserAgent,
      connectionUptime: this.#deviceConnectedTimestamp - Date.now(),
    });
  }
}

export default DeviceEventReporter;
