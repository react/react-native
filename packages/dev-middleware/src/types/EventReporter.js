/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {DebuggerShellPreparationResult} from './DevToolLauncher';

type SuccessResult<Props extends {...} | void = {}> = {
  status: 'success',
  ...Props,
};

type ErrorResult<ErrorT = unknown, Props extends {...} | void = {}> = {
  status: 'error',
  error: ErrorT,
  ...Props,
};

type CodedErrorResult<ErrorCode extends string> = {
  status: 'coded_error',
  errorCode: ErrorCode,
  errorDetails?: string,
};

export type DebuggerSessionIDs = {
  appId: string | null,
  deviceName: string | null,
  deviceId: string | null,
  pageId: string | null,
};

export type ConnectionUptime = {
  connectionUptime: number,
};

export type ReportableEvent =
  | {
      type: 'launch_debugger_frontend',
      launchType: 'launch' | 'redirect',
      ...
        | SuccessResult<{
            targetDescription: string,
            ...DebuggerSessionIDs,
          }>
        | ErrorResult<unknown>
        | CodedErrorResult<'NO_APPS_FOUND'>,
    }
  | {
      type: 'connect_debugger_frontend',
      ...
        | SuccessResult<{
            ...DebuggerSessionIDs,
            frontendUserAgent: string | null,
          }>
        | ErrorResult<unknown, DebuggerSessionIDs>,
    }
  | {
      type: 'debugger_command',
      protocol: 'CDP',
      // With some errors, the method might not be known
      method: string | null,
      requestOrigin: 'proxy' | 'debugger' | null,
      responseOrigin: 'proxy' | 'device',
      timeSinceStart: number | null,
      ...DebuggerSessionIDs,
      ...ConnectionUptime,
      frontendUserAgent: string | null,
      ...
        | SuccessResult<void>
        | CodedErrorResult<
            | 'TIMED_OUT'
            | 'DEVICE_DISCONNECTED'
            | 'DEBUGGER_DISCONNECTED'
            | 'UNMATCHED_REQUEST_ID'
            | 'PROTOCOL_ERROR',
          >,
    }
  | {
      type: 'profiling_target_registered',
      status: 'success',
      ...DebuggerSessionIDs,
    }
  | {
      type: 'no_debug_pages_for_device',
      ...DebuggerSessionIDs,
    }
  | {
      type: 'proxy_error',
      status: 'error',
      messageOrigin: 'debugger' | 'device',
      message: string,
      error: string,
      errorStack: string,
      ...ConnectionUptime,
      ...DebuggerSessionIDs,
    }
  | {
      type: 'debugger_high_ping' | 'device_high_ping',
      duration: number,
      timeSinceLastCommunication: number | null,
      ...ConnectionUptime,
      ...DebuggerSessionIDs,
    }
  | {
      type: 'debugger_timeout' | 'device_timeout',
      duration: number,
      timeSinceLastCommunication: number | null,
      ...ConnectionUptime,
      ...DebuggerSessionIDs,
    }
  | {
      type: 'debugger_connection_closed' | 'device_connection_closed',
      code: number,
      reason: string,
      timeSinceLastCommunication: number | null,
      ...ConnectionUptime,
      ...DebuggerSessionIDs,
    }
  | {
      type: 'high_event_loop_delay',
      eventLoopUtilization: number,
      maxEventLoopDelayPercent: number,
      duration: number,
      ...ConnectionUptime,
      ...DebuggerSessionIDs,
    }
  | {
      type: 'fusebox_shell_preparation_attempt',
      result: DebuggerShellPreparationResult,
    };

/**
 * A simple interface for logging events, to be implemented by integrators of
 * `dev-middleware`.
 *
 * This is an unstable API with no semver guarantees.
 */
export interface EventReporter {
  logEvent(event: ReportableEvent): void;
}
