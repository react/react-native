/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Config} from '@react-native-community/cli-types';
import type {Reporter, TerminalReportableEvent, TerminalReporter} from 'metro';

import createDevMiddlewareLogger from '../../utils/createDevMiddlewareLogger';
import isDevServerRunning from '../../utils/isDevServerRunning';
import loadMetroConfig from '../../utils/loadMetroConfig';
import * as version from '../../utils/version';
import attachKeyHandlers from './attachKeyHandlers';
import {createDevServerMiddleware} from './middleware';
import {createDevMiddleware} from '@react-native/dev-middleware';
import * as Metro from 'metro';
import path from 'path';
import url from 'url';
import {styleText} from 'util';

export type StartCommandArgs = {
  assetPlugins?: string[],
  cert?: string,
  customLogReporterPath?: string,
  host?: string,
  https?: boolean,
  maxWorkers?: number,
  key?: string,
  platforms: string[],
  port?: number,
  resetCache?: boolean,
  sourceExts?: string[],
  transformer?: string,
  watchFolders?: string[],
  config?: string,
  projectRoot?: string,
  interactive: boolean,
  clientLogs: boolean,
};

async function runServer(
  _argv: Array<string>,
  cliConfig: Config,
  args: StartCommandArgs,
) {
  const metroConfig = await loadMetroConfig(cliConfig, {
    config: args.config,
    maxWorkers: args.maxWorkers,
    port: args.port,
    resetCache: args.resetCache,
    watchFolders: args.watchFolders,
    projectRoot: args.projectRoot,
    sourceExts: args.sourceExts,
  });
  const hostname = args.host?.length ? args.host : 'localhost';
  const {
    projectRoot,
    server: {port},
    watchFolders,
  } = metroConfig;
  const protocol = args.https === true ? 'https' : 'http';
  const devServerUrl = url.format({protocol, hostname, port});

  console.info(
    styleText(
      'blue',
      `\nWelcome to React Native v${cliConfig.reactNativeVersion}`,
    ),
  );

  const serverStatus = await isDevServerRunning(devServerUrl, projectRoot);

  if (serverStatus === 'matched_server_running') {
    console.info(
      `A dev server is already running for this project on port ${port}. Exiting.`,
    );
    return;
  } else if (serverStatus === 'port_taken') {
    console.error(
      `${styleText('red', 'error')}: Another process is running on port ${port}. Please terminate this ` +
        'process and try again, or use another port with "--port".',
    );
    return;
  }

  console.info(`Starting dev server on ${devServerUrl}\n`);

  if (args.assetPlugins) {
    // $FlowFixMe[cannot-write] Assigning to readonly property
    metroConfig.transformer.assetPlugins = args.assetPlugins.map(plugin =>
      require.resolve(plugin),
    );
  }
  // TODO(T214991636): Remove legacy Metro log forwarding
  if (!args.clientLogs) {
    // $FlowFixMe[cannot-write] Assigning to readonly property
    metroConfig.server.forwardClientLogs = false;
  }

  let reportEvent: (event: TerminalReportableEvent) => void;
  const terminal = new Metro.Terminal(process.stdout);
  const ReporterImpl = getReporterImpl(args.customLogReporterPath);
  const terminalReporter = new ReporterImpl(terminal);

  const {
    middleware: communityMiddleware,
    websocketEndpoints: communityWebsocketEndpoints,
    messageSocketEndpoint,
    eventsSocketEndpoint,
  } = createDevServerMiddleware({
    host: hostname,
    port,
    watchFolders,
  });
  const {middleware, websocketEndpoints} = createDevMiddleware({
    serverBaseUrl: devServerUrl,
    logger: createDevMiddlewareLogger(terminalReporter),
  });

  const reporter: Reporter = {
    update(event: TerminalReportableEvent) {
      terminalReporter.update(event);
      /* $FlowFixMe[constant-condition] Error discovered during Constant
       * Condition roll out. See https://fburl.com/workplace/1v97vimq. */
      if (reportEvent) {
        reportEvent(event);
      }
      if (args.interactive && event.type === 'initialize_done') {
        terminalReporter.update({
          type: 'unstable_server_log',
          level: 'info',
          data: `Dev server ready. ${styleText('dim', 'Press Ctrl+C to exit.')}`,
        });
        attachKeyHandlers({
          devServerUrl,
          messageSocket: messageSocketEndpoint,
          reporter: terminalReporter,
        });
      }
    },
  };
  // $FlowFixMe[cannot-write] Assigning to readonly property
  metroConfig.reporter = reporter;

  await Metro.runServer(metroConfig, {
    host: args.host,
    secure: args.https,
    secureCert: args.cert,
    secureKey: args.key,
    unstable_extraMiddleware: [communityMiddleware, middleware],
    websocketEndpoints: {
      ...communityWebsocketEndpoints,
      ...websocketEndpoints,
    },
  });

  reportEvent = eventsSocketEndpoint.reportEvent;

  await version.logIfUpdateAvailable(cliConfig, terminalReporter);
}

function getReporterImpl(
  customLogReporterPath?: string,
): Class<TerminalReporter> {
  if (customLogReporterPath == null) {
    return require('metro').TerminalReporter;
  }
  try {
    // First we let require resolve it, so we can require packages in node_modules
    // as expected. eg: require('my-package/reporter');
    // $FlowFixMe[unsupported-syntax]
    return require(customLogReporterPath);
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
      throw e;
    }
    // If that doesn't work, then we next try relative to the cwd, eg:
    // require('./reporter');
    // $FlowFixMe[unsupported-syntax]
    return require(path.resolve(customLogReporterPath));
  }
}

export default runServer;
