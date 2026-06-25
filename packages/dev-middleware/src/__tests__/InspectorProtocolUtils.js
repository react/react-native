/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  JSONSerializable,
  PageDescription,
  PageFromDevice,
} from '../inspector-proxy/types';
import type {DebuggerMock} from './InspectorDebuggerUtils';
import type {DeviceMock} from './InspectorDeviceUtils';

import {fetchJson} from './FetchUtils';
import {createDebuggerMock} from './InspectorDebuggerUtils';
import {createDeviceMock} from './InspectorDeviceUtils';
import until from 'wait-for-expect';

export type CdpMessageFromTarget = Readonly<{
  method: string,
  id?: number,
  params?: JSONSerializable,
}>;

export type CdpResponseFromTarget = Readonly<{
  id: number,
  result: JSONSerializable,
}>;

export type CdpMessageToTarget = Readonly<{
  method: string,
  id: number,
  params?: JSONSerializable,
}>;

/**
 * Send a CDP message from the target with the given pageId to the debugger.
 * Returns the message as received by the debugger.
 */
export async function sendFromTargetToDebugger<
  Message extends CdpMessageFromTarget,
>(
  device: DeviceMock,
  debugger_: DebuggerMock,
  pageId: string,
  message: Message,
): Promise<Message> {
  const originalHandleCallsArray = debugger_.handle.mock.calls;
  const originalHandleCallCount = originalHandleCallsArray.length;
  device.sendWrappedEvent(pageId, message);
  await until(() =>
    expect(debugger_.handle).toBeCalledWith(
      expect.objectContaining({
        method: message.method,
      }),
    ),
  );
  // Find the first handle call that wasn't already in the mock calls array
  // before we sent the message.
  const newHandleCalls =
    originalHandleCallsArray === debugger_.handle.mock.calls
      ? debugger_.handle.mock.calls.slice(originalHandleCallCount)
      : debugger_.handle.mock.calls;
  // $FlowFixMe[incompatible-type]
  const [receivedMessage]: [Message] = newHandleCalls.find(
    // $FlowFixMe[incompatible-type]
    (call: [Message]) => call[0].method === message.method,
  );
  return receivedMessage;
}

/**
 * Send a CDP message from the debugger to the target with the given pageId.
 * Returns the message as received by the target.
 */
export async function sendFromDebuggerToTarget<
  Message extends CdpMessageToTarget,
>(
  debugger_: DebuggerMock,
  device: DeviceMock,
  pageId: string,
  message: Message,
  {sessionId}: {sessionId?: string} = {},
): Promise<Message> {
  const originalEventCallsArray = device.wrappedEventParsed.mock.calls;
  const originalEventCallCount = originalEventCallsArray.length;
  debugger_.send(message);
  await until(() =>
    expect(device.wrappedEventParsed).toBeCalledWith({
      pageId,
      sessionId: sessionId ?? expect.any(String),
      wrappedEvent: expect.objectContaining({id: message.id}),
    }),
  );
  // Find the first handle call that wasn't already in the mock calls array
  // before we sent the message.
  const newEventCalls =
    originalEventCallsArray === device.wrappedEventParsed.mock.calls
      ? device.wrappedEventParsed.mock.calls.slice(originalEventCallCount)
      : device.wrappedEventParsed.mock.calls;
  // $FlowFixMe[incompatible-use]
  const [receivedMessage] = newEventCalls.find(
    // $FlowFixMe[prop-missing]
    // $FlowFixMe[incompatible-use]
    call => call[0].wrappedEvent.id === message.id,
  );
  // $FlowFixMe[incompatible-type]
  return receivedMessage.wrappedEvent;
}

export async function createAndConnectTarget(
  serverRef: Readonly<{
    serverBaseUrl: string,
    serverBaseWsUrl: string,
    ...
  }>,
  signal: AbortSignal,
  page: PageFromDevice,
  {
    debuggerHeaders = null,
    deviceId = null,
    deviceHostHeader = null,
  }: Readonly<{
    debuggerHeaders?: ?{[string]: unknown},
    debuggerOriginHeader?: ?string,
    deviceId?: ?string,
    deviceHostHeader?: ?string,
  }> = {},
): Promise<{device: DeviceMock, debugger_: DebuggerMock, sessionId: string}> {
  let device;
  let debugger_;
  let sessionId;
  try {
    device = await createDeviceMock(
      `${serverRef.serverBaseWsUrl}/inspector/device?device=${
        deviceId ?? 'device' + Date.now()
      }&name=foo&app=bar`,
      signal,
      deviceHostHeader,
    );
    device.getPages.mockImplementation(() => [page]);

    let pageList: Array<PageDescription> = [];
    await until(async () => {
      pageList = (await fetchJson(
        `${serverRef.serverBaseUrl}/json`,
        // $FlowFixMe[unclear-type]
      )) as any;
      expect(pageList).toHaveLength(1);
    });
    const [{webSocketDebuggerUrl}] = pageList;
    expect(webSocketDebuggerUrl).toBeDefined();

    const originalConnectCallsArray = device.connect.mock.calls;
    const originalConnectCallCount = originalConnectCallsArray.length;
    debugger_ = await createDebuggerMock(
      webSocketDebuggerUrl,
      signal,
      debuggerHeaders,
    );
    await until(() => expect(device.connect).toBeCalled());
    // Find the first connect call that wasn't already in the mock calls array
    // before we connected the debugger.
    const newConnectCalls =
      originalConnectCallsArray === device.connect.mock.calls
        ? device.connect.mock.calls.slice(originalConnectCallCount)
        : device.connect.mock.calls;
    const [[{payload}]] = newConnectCalls;
    sessionId = payload.sessionId;
  } catch (e) {
    device?.close();
    debugger_?.close();
    throw e;
  }
  return {device, debugger_, sessionId};
}
