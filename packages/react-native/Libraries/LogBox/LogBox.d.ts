/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

export interface LogBoxStatic {
  /**
   * Silence any logs that match the given strings or regexes.
   */
  ignoreLogs(patterns: (string | RegExp)[]): void;

  /**
   * Toggle error and warning notifications
   * Note: this only disables notifications, uncaught errors will still open a full screen LogBox.
   * @param ignore whether to ignore logs or not
   */
  ignoreAllLogs(ignore?: boolean): void;

  install(): void;
  uninstall(): void;

  /**
   * Whether LogBox is currently installed.
   */
  isInstalled(): boolean;

  /**
   * Clear all logs and dismiss the LogBox surface. Invoked by the Fast Refresh
   * pipeline on each applied update.
   */
  clearAllLogs(): void;
}

export const LogBox: LogBoxStatic;
export type LogBox = LogBoxStatic;
