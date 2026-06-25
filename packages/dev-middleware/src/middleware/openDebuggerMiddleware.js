/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {InspectorProxyQueries} from '../inspector-proxy/InspectorProxy';
import type {PageDescription} from '../inspector-proxy/types';
import type {
  DebuggerShellPreparationResult,
  DevToolLauncher,
} from '../types/DevToolLauncher';
import type {EventReporter} from '../types/EventReporter';
import type {Experiments} from '../types/Experiments';
import type {Logger} from '../types/Logger';
import type {ReadonlyURL} from '../types/ReadonlyURL';
import type {NextHandleFunction} from 'connect';
import type {IncomingMessage, ServerResponse} from 'http';

import getDevToolsFrontendUrl from '../utils/getDevToolsFrontendUrl';
import {createHash} from 'crypto';

const LEGACY_SYNTHETIC_PAGE_TITLE =
  'React Native Experimental (Improved Chrome Reloads)';

type Options = Readonly<{
  serverBaseUrl: ReadonlyURL,
  logger?: Logger,
  toolLauncher: DevToolLauncher,
  eventReporter?: EventReporter,
  experiments: Experiments,
  inspectorProxy: InspectorProxyQueries,
}>;

/**
 * Open the debugger frontend for a given CDP target.
 *
 * @see https://chromedevtools.github.io/devtools-protocol/
 */
export default function openDebuggerMiddleware({
  serverBaseUrl,
  logger,
  toolLauncher,
  eventReporter,
  experiments,
  inspectorProxy,
}: Options): NextHandleFunction {
  let shellPreparationPromise: Promise<DebuggerShellPreparationResult>;
  if (experiments.enableStandaloneFuseboxShell) {
    shellPreparationPromise =
      toolLauncher?.prepareDebuggerShell?.() ??
      Promise.resolve({code: 'not_implemented'});
    shellPreparationPromise = shellPreparationPromise.then(result => {
      eventReporter?.logEvent({
        type: 'fusebox_shell_preparation_attempt',
        result,
      });
      return result;
    });
  }

  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: Error) => void,
  ) => {
    if (
      req.method === 'POST' ||
      (experiments.enableOpenDebuggerRedirect && req.method === 'GET')
    ) {
      const {searchParams} = new URL(req.url, 'http://example.com');

      const query: {
        /** @deprecated Will only match legacy Hermes targets */
        appId?: string,
        /** @deprecated Will only match legacy Hermes targets */
        device?: string,
        launchId?: string,
        telemetryInfo?: string,
        target?: string,
        panel?: string,
        ...
      } = Object.fromEntries(searchParams);

      const targets = inspectorProxy
        .getPageDescriptions({
          requestorRelativeBaseUrl: serverBaseUrl,
        })
        .filter(app => {
          const betterReloadingSupport =
            app.title === LEGACY_SYNTHETIC_PAGE_TITLE ||
            app.reactNative.capabilities?.nativePageReloads === true;

          if (!betterReloadingSupport) {
            logger?.warn(
              "Ignoring DevTools app debug target for '%s' with title '%s' and 'nativePageReloads' capability set to '%s'. ",
              app.appId,
              app.title,
              String(app.reactNative.capabilities?.nativePageReloads),
            );
          }

          return betterReloadingSupport;
        });

      let target: PageDescription | void;

      const launchType: 'launch' | 'redirect' =
        req.method === 'POST' ? 'launch' : 'redirect';

      if (
        typeof query.target === 'string' ||
        typeof query.appId === 'string' ||
        typeof query.device === 'string'
      ) {
        logger?.info(
          (launchType === 'launch' ? 'Launching' : 'Redirecting to') +
            ' DevTools...',
        );

        target = targets.find(
          _target =>
            (query.target == null || _target.id === query.target) &&
            (query.appId == null ||
              (_target.appId === query.appId &&
                _target.title === LEGACY_SYNTHETIC_PAGE_TITLE)) &&
            (query.device == null ||
              _target.reactNative.logicalDeviceId === query.device),
        );
      } else if (targets.length > 0) {
        logger?.info(
          (launchType === 'launch' ? 'Launching' : 'Redirecting to') +
            ` DevTools${targets.length === 1 ? '' : ' for most recently connected target'}...`,
        );
        target = targets[targets.length - 1];
      }

      if (!target) {
        res.writeHead(404);
        res.end('Unable to find debugger target');
        logger?.warn(
          'No compatible apps connected. React Native DevTools can only be used with the Hermes engine.',
        );
        eventReporter?.logEvent({
          type: 'launch_debugger_frontend',
          launchType,
          status: 'coded_error',
          errorCode: 'NO_APPS_FOUND',
        });
        return;
      }

      try {
        switch (launchType) {
          case 'launch': {
            const frontendUrl = getDevToolsFrontendUrl(
              experiments,
              target.webSocketDebuggerUrl,
              new URL(serverBaseUrl),
              {
                launchId: query.launchId,
                telemetryInfo: query.telemetryInfo,
                appId: target.appId,
                panel: query.panel,
              },
            );
            let shouldUseStandaloneFuseboxShell =
              experiments.enableStandaloneFuseboxShell;
            if (shouldUseStandaloneFuseboxShell) {
              const shellPreparationResult = await shellPreparationPromise;
              switch (shellPreparationResult.code) {
                case 'success':
                case 'not_implemented':
                  break;
                case 'platform_not_supported':
                case 'possible_corruption':
                case 'likely_offline':
                case 'unexpected_error':
                  shouldUseStandaloneFuseboxShell = false;
                  break;
                default:
                  shellPreparationResult.code as empty;
              }
            }
            if (shouldUseStandaloneFuseboxShell) {
              const windowKey = createHash('sha256')
                .update(
                  [
                    serverBaseUrl,
                    target.webSocketDebuggerUrl,
                    target.appId,
                  ].join('-'),
                )
                .digest('hex');
              if (!toolLauncher.launchDebuggerShell) {
                throw new Error(
                  'Fusebox shell is not supported by the current app launcher',
                );
              }
              await toolLauncher.launchDebuggerShell(frontendUrl, windowKey);
            } else {
              await toolLauncher.launchDebuggerAppWindow(frontendUrl);
            }
            res.writeHead(200);
            res.end();
            break;
          }
          case 'redirect':
            res.writeHead(302, {
              Location: getDevToolsFrontendUrl(
                experiments,
                target.webSocketDebuggerUrl,
                new URL(serverBaseUrl),
                {
                  relative: true,
                  launchId: query.launchId,
                  telemetryInfo: query.telemetryInfo,
                  appId: target.appId,
                },
              ),
            });
            res.end();
            break;
          default:
            launchType as empty;
        }
        eventReporter?.logEvent({
          type: 'launch_debugger_frontend',
          launchType,
          status: 'success',
          appId: target.appId,
          deviceId: target.reactNative.logicalDeviceId,
          pageId: target.id,
          deviceName: target.deviceName,
          targetDescription: target.description,
        });
        return;
      } catch (e) {
        logger?.error(
          'Error launching DevTools: ' + e.message ?? 'Unknown error',
        );
        res.writeHead(500);
        res.end();
        eventReporter?.logEvent({
          type: 'launch_debugger_frontend',
          launchType,
          status: 'error',
          error: e,
        });
        return;
      }
    }

    next();
  };
}
