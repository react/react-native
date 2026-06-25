/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {JSONSerializable} from '../types';
import type {Commands, Events} from './protocol';

// Note: A CDP event is a JSON-RPC notification with no `id` member.
export type CDPEvent<TEvent extends keyof Events = 'unknown'> = {
  method: TEvent,
  params: Events[TEvent],
};

export type CDPRequest<TCommand extends keyof Commands = 'unknown'> = {
  method: TCommand,
  params: Commands[TCommand]['paramsType'],
  id: number,
};

export type CDPResponse<TCommand extends keyof Commands = 'unknown'> =
  | {
      result: Commands[TCommand]['resultType'],
      id: number,
    }
  | {
      error: CDPRequestError,
      id: number,
    };

export type CDPRequestError = {
  code: number,
  message: string,
  data?: JSONSerializable,
};

export type CDPClientMessage =
  | CDPRequest<'Debugger.getScriptSource'>
  | CDPRequest<'Debugger.scriptParsed'>
  | CDPRequest<'Debugger.setBreakpointByUrl'>
  | CDPRequest<'Network.loadNetworkResource'>
  | CDPRequest<>;

export type CDPServerMessage =
  | CDPEvent<'Debugger.scriptParsed'>
  | CDPEvent<'Runtime.consoleAPICalled'>
  | CDPEvent<>
  | CDPResponse<'Debugger.getScriptSource'>
  | CDPResponse<>;
