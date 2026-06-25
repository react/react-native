/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {CreateCustomMessageHandlerFn} from './inspector-proxy/CustomMessageHandler';
import type {DevToolLauncher} from './types/DevToolLauncher';
import type {EventReporter, ReportableEvent} from './types/EventReporter';
import type {Experiments, ExperimentsConfig} from './types/Experiments';
import type {Logger} from './types/Logger';
import type {ReadonlyURL} from './types/ReadonlyURL';
import type {NextHandleFunction} from 'connect';

import InspectorProxy from './inspector-proxy/InspectorProxy';
import openDebuggerMiddleware from './middleware/openDebuggerMiddleware';
import DefaultToolLauncher from './utils/DefaultToolLauncher';
import reactNativeDebuggerFrontendPath from '@react-native/debugger-frontend';
import connect from 'connect';
import path from 'path';
import serveStaticMiddleware from 'serve-static';

type Options = Readonly<{
  /**
   * The base URL to the dev server, as reachable from the machine on which
   * dev-middleware is hosted. Typically `http://localhost:${metroPort}`.
   */
  serverBaseUrl: string | ReadonlyURL,

  /**
   * An implementation for logging messages to the terminal (recommended).
   *
   * In `@react-native/community-cli-plugin`, this reuses Metro's
   * 'unstable_server_log' event in `TerminalReporter`.
   */
  logger?: Logger,

  /**
   * An `EventReporter` implementation for logging structured events
   * (recommended).
   *
   * This is an unstable API with no semver guarantees.
   */
  unstable_eventReporter?: EventReporter,

  /**
   * The set of experimental features to enable.
   *
   * This is an unstable API with no semver guarantees.
   */
  unstable_experiments?: ExperimentsConfig,

  /**
   * Override the default handlers for launching external applications (the
   * debugger frontend) on the host machine (or target dev machine).
   *
   * This is an unstable API with no semver guarantees.
   */
  unstable_toolLauncher?: DevToolLauncher,

  /**
   * Create custom handler to add support for unsupported CDP events, or debuggers.
   * This handler is instantiated per logical device and debugger pair.
   *
   * This is an unstable API with no semver guarantees.
   */
  unstable_customInspectorMessageHandler?: CreateCustomMessageHandlerFn,

  /**
   * Whether to measure the event loop performance of inspector proxy and
   * report it via the event reporter.
   *
   * This is an unstable API with no semver guarantees.
   */
  unstable_trackInspectorProxyEventLoopPerf?: boolean,
}>;

type DevMiddlewareAPI = Readonly<{
  middleware: NextHandleFunction,
  websocketEndpoints: {[path: string]: ws$WebSocketServer},
}>;

export default function createDevMiddleware({
  serverBaseUrl,
  logger,
  unstable_eventReporter,
  unstable_experiments: experimentConfig = {},
  unstable_toolLauncher = DefaultToolLauncher,
  unstable_customInspectorMessageHandler,
  unstable_trackInspectorProxyEventLoopPerf = false,
}: Options): DevMiddlewareAPI {
  const normalizedServerBaseUrl: ReadonlyURL = new URL(serverBaseUrl);

  const experiments = getExperiments(experimentConfig);
  const eventReporter = createWrappedEventReporter(
    unstable_eventReporter,
    logger,
    experiments,
  );

  const inspectorProxy = new InspectorProxy(
    normalizedServerBaseUrl,
    eventReporter,
    experiments,
    logger,
    unstable_customInspectorMessageHandler,
    unstable_trackInspectorProxyEventLoopPerf,
  );

  const middleware = connect()
    .use(
      '/open-debugger',
      openDebuggerMiddleware({
        serverBaseUrl: normalizedServerBaseUrl,
        inspectorProxy,
        toolLauncher: unstable_toolLauncher,
        eventReporter,
        experiments,
        logger,
      }),
    )
    .use(
      '/debugger-frontend/embedder-static/embedderScript.js',
      (_req, res) => {
        res.setHeader('Content-Type', 'application/javascript');
        res.end('');
      },
    )
    .use(
      '/debugger-frontend',
      serveStaticMiddleware(path.join(reactNativeDebuggerFrontendPath), {
        fallthrough: false,
      }),
    )
    .use((...args) => inspectorProxy.processRequest(...args));

  return {
    middleware,
    websocketEndpoints: inspectorProxy.createWebSocketListeners(),
  };
}

function getExperiments(config: ExperimentsConfig): Experiments {
  return {
    enableOpenDebuggerRedirect: config.enableOpenDebuggerRedirect ?? false,
    enableNetworkInspector: config.enableNetworkInspector ?? false,
    enableStandaloneFuseboxShell: config.enableStandaloneFuseboxShell ?? true,
  };
}

/**
 * Creates a wrapped EventReporter that locally intercepts events to
 * log to the terminal.
 */
function createWrappedEventReporter(
  reporter: ?EventReporter,
  logger: ?Logger,
  experiments: Experiments,
): EventReporter {
  return {
    logEvent(event: ReportableEvent) {
      switch (event.type) {
        case 'profiling_target_registered':
          logger?.info(
            "Profiling build target '%s' registered for debugging",
            event.appId ?? 'unknown',
          );
          break;
        case 'fusebox_shell_preparation_attempt':
          switch (event.result.code) {
            case 'success':
            case 'not_implemented':
              break;
            case 'unexpected_error': {
              let message =
                event.result.humanReadableMessage ??
                'An unknown error occurred while installing React Native DevTools.';
              if (event.result.verboseInfo != null) {
                message += ` Details:\n\n${event.result.verboseInfo}`;
              } else {
                message += '.';
              }
              logger?.error(message);
              break;
            }
            case 'possible_corruption':
            case 'platform_not_supported':
            case 'likely_offline':
              logger?.warn(
                event.result.humanReadableMessage ??
                  `An error of type ${event.result.code} occurred while installing React Native DevTools.`,
              );
              break;
            default:
              event.result.code as empty;
              break;
          }
      }

      reporter?.logEvent(event);
    },
  };
}
