/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Command} from '@react-native-community/cli-types';

import runServer from './runServer';
import path from 'node:path';

export type {StartCommandArgs} from './runServer';

const startCommand: Command = {
  name: 'start',
  func: runServer,
  description: 'Start the React Native development server.',
  options: [
    {
      name: '--port <number>',
      parse: Number,
    },
    {
      name: '--host <string>',
      default: '',
    },
    {
      name: '--projectRoot <path>',
      description: 'Path to a custom project root',
      parse: (val: string): string => path.resolve(val),
    },
    {
      name: '--watchFolders <list>',
      description:
        'Specify any additional folders to be added to the watch list',
      parse: (val: string): Array<string> =>
        val.split(',').map((folder: string) => path.resolve(folder)),
    },
    {
      name: '--assetPlugins <list>',
      description:
        'Specify any additional asset plugins to be used by the packager by full filepath',
      parse: (val: string): Array<string> => val.split(','),
    },
    {
      name: '--sourceExts <list>',
      description:
        'Specify any additional source extensions to be used by the packager',
      parse: (val: string): Array<string> => val.split(','),
    },
    {
      name: '--max-workers <number>',
      description:
        'Specifies the maximum number of workers the worker-pool ' +
        'will spawn for transforming files. This defaults to the number of the ' +
        'cores available on your machine.',
      parse: (workers: string): number => Number(workers),
    },
    {
      name: '--transformer <string>',
      description: 'Specify a custom transformer to be used',
    },
    {
      name: '--reset-cache, --resetCache',
      description: 'Removes cached files',
    },
    {
      name: '--custom-log-reporter-path, --customLogReporterPath <string>',
      description:
        'Path to a JavaScript file that exports a log reporter as a replacement for TerminalReporter',
    },
    {
      name: '--https',
      description: 'Enables https connections to the server',
    },
    {
      name: '--key <path>',
      description: 'Path to custom SSL key',
    },
    {
      name: '--cert <path>',
      description: 'Path to custom SSL cert',
    },
    {
      name: '--config <string>',
      description: 'Path to the CLI configuration file',
      parse: (val: string): string => path.resolve(val),
    },
    {
      name: '--no-interactive',
      description: 'Disables interactive mode',
    },
    {
      name: '--client-logs',
      description:
        '[Deprecated] Enable plain text JavaScript log streaming for all ' +
        'connected apps. This feature is deprecated and will be removed in ' +
        'future.',
      default: false,
    },
  ],
};

export default startCommand;
