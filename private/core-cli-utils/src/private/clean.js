/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/*::
import type {Task} from './types';
import type {ExecaPromise, Options as ExecaOptions} from 'execa';
*/

const {
  assertDependencies,
  isMacOS,
  isOnPath,
  isWindows,
  task,
} = require('./utils');
const execa = require('execa');
const {existsSync, readdirSync, rm} = require('fs');
const os = require('os');
const path = require('path');

const FIRST = 1,
  SECOND = 2;

const rmrf = (pathname /*: string */) => {
  if (!existsSync(pathname)) {
    return;
  }
  rm(pathname, {force: true, maxRetries: 3, recursive: true});
};

/**
 * Removes the contents of a directory matching a given pattern, but keeps the directory.
 * @private
 */
function deleteDirectoryContents(
  directory /*: string */,
  filePattern /*: RegExp */,
) /*: () => Promise<void> */ {
  return async function deleteDirectoryContentsAction() {
    const base = path.dirname(directory);
    const files = readdirSync(base).filter((filename /*: string */) =>
      filePattern.test(filename),
    );
    for (const filename of files) {
      rmrf(path.join(base, filename));
    }
  };
}

/**
 * Removes a directory recursively.
 * @private
 */
function deleteDirectory(directory /*: string */) /*: () => Promise<void> */ {
  return async function cleanDirectoryAction() {
    rmrf(directory);
  };
}

/**
 * Deletes the contents of the tmp directory matching a given pattern.
 * @private
 */
function deleteTmpDirectoryContents(
  filepattern /*: RegExp */,
) /*: () => Promise<void> */ {
  return deleteDirectoryContents(os.tmpdir(), filepattern);
}

const platformGradlew = isWindows ? 'gradlew.bat' : 'gradlew';

/*::
type CocoaPodsClean = {
  clean: Task<ExecaPromise>,
};
type AndroidClean = {
  validate: Task<void>,
  run: Task<ExecaPromise>,
};
type MetroClean = {
  metro: Task<Promise<void>>,
  haste: Task<Promise<void>>,
  react_native: Task<Promise<void>>,
};

type NpmClean = {
  node_modules: Task<Promise<void>>,
  verify_cache: Task<ExecaPromise>,
};

type WatchmanClean = {
  stop: Task<ExecaPromise>,
  cache: Task<ExecaPromise>,
};

type YarnClean = {
  clean: Task<ExecaPromise>,
};

type CleanTasks = {
  android: (andoirdSrcDir: ?string, opts?: ExecaOptions) => AndroidClean,
  cocoapods: CocoaPodsClean,
  metro: () => MetroClean,
  npm: (projectRootDir: string) => NpmClean,
  watchman: (projectRootDir: string) => WatchmanClean,
  yarn: (projectRootDir: string) => YarnClean,
  cocoapods?: (projectRootDir: string) => CocoaPodsClean,
};
*/

// The tasks that cleanup various build artefacts.
/* eslint sort-keys: "off" */
const tasks /*: CleanTasks */ = {
  /**
   * Cleans up the Android Gradle cache
   */
  android: (androidSrcDir /*: ?string */, opts /*: ?ExecaOptions */) => ({
    validate: task(FIRST, 'Check gradlew is available', () => {
      assertDependencies(isOnPath(platformGradlew, 'Gradle wrapper'));
    }),
    run: task(SECOND, '🧹 Clean Gradle cache', () => {
      const gradlew = path.join(androidSrcDir ?? 'android', platformGradlew);
      const script = path.basename(gradlew);
      const cwd = path.dirname(gradlew);
      return execa(isWindows ? script : './' + script, ['clean'], {
        cwd,
        ...opts,
      });
    }),
  }),

  /**
   * Aggressively cleans up all Metro caches.
   */
  metro: () => ({
    metro: task(
      FIRST,
      '🧹 Clean Metro cache',
      deleteTmpDirectoryContents(/^metro-.+/),
    ),
    haste: task(
      FIRST,
      '🧹 Clean Haste cache',
      deleteTmpDirectoryContents(/^haste-map-.+/),
    ),
    react_native: task(
      FIRST,
      '🧹 Clean React Native cache',
      deleteTmpDirectoryContents(/^react-.+/),
    ),
  }),

  /**
   * Cleans up the `node_modules` folder and optionally garbage collects the npm cache.
   */
  npm: (projectRootDir /*: string */) => ({
    node_modules: task(
      FIRST,
      '🧹 Clean node_modules',
      deleteDirectory(path.join(projectRootDir, 'node_modules')),
    ),
    verify_cache: task(
      SECOND,
      '🔬 Verify npm cache',
      (opts /*: ?ExecaOptions */) =>
        execa('npm', ['cache', 'verify'], {cwd: projectRootDir, ...opts}),
    ),
  }),

  /**
   * Stops Watchman and clears its cache
   */
  watchman: (projectRootDir /*: string */) => ({
    stop: task(FIRST, '✋ Stop Watchman', (opts /*: ?ExecaOptions */) =>
      execa(isWindows ? 'tskill' : 'killall', ['watchman'], {
        cwd: projectRootDir,
        ...opts,
      }),
    ),
    cache: task(
      SECOND,
      '🧹 Delete Watchman cache',
      (opts /*: ?ExecaOptions */) =>
        execa('watchman', ['watch-del-all'], {cwd: projectRootDir, ...opts}),
    ),
  }),

  /**
   * Cleans up the Yarn cache
   */
  yarn: (projectRootDir /*: string */) => ({
    clean: task(FIRST, '🧹 Clean Yarn cache', (opts /*: ?ExecaOptions */) =>
      execa('yarn', ['cache', 'clean'], {cwd: projectRootDir, ...opts}),
    ),
  }),
};

if (isMacOS) {
  /**
   * Cleans up the local and global CocoaPods cache
   */
  tasks.cocoapods = (projectRootDir /*: string */) => ({
    clean: task(
      FIRST,
      '🧹 Clean CocoaPods pod cache',
      (opts /*: ?ExecaOptions */) =>
        execa('bundle', ['exec', 'pod', 'deintegrate'], {
          cwd: projectRootDir,
          ...opts,
        }),
    ),
  });
}

module.exports = {
  deleteDirectory,
  deleteDirectoryContents,
  deleteTmpDirectoryContents,
  tasks,
};
