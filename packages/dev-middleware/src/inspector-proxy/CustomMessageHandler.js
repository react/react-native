/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {JSONSerializable, Page} from './types';

type ExposedDevice = Readonly<{
  appId: string,
  id: string,
  name: string,
  sendMessage: (message: JSONSerializable) => void,
}>;

type ExposedDebugger = Readonly<{
  userAgent: string | null,
  sendMessage: (message: JSONSerializable) => void,
}>;

export type CustomMessageHandlerConnection = Readonly<{
  page: Page,
  device: ExposedDevice,
  debugger: ExposedDebugger,
}>;

export type CreateCustomMessageHandlerFn = (
  connection: CustomMessageHandlerConnection,
) => ?CustomMessageHandler;

/**
 * The device message middleware allows implementers to handle unsupported CDP messages.
 * It is instantiated per device and may contain state that is specific to that device.
 * The middleware can also mark messages from the device or debugger as handled, which stops propagating.
 */
export interface CustomMessageHandler {
  /**
   * Handle a CDP message coming from the device.
   * This is invoked before the message is sent to the debugger.
   * When returning true, the message is considered handled and will not be sent to the debugger.
   */
  handleDeviceMessage(message: JSONSerializable): true | void;

  /**
   * Handle a CDP message coming from the debugger.
   * This is invoked before the message is sent to the device.
   * When returning true, the message is considered handled and will not be sent to the device.
   */
  handleDebuggerMessage(message: JSONSerializable): true | void;
}
