/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

export type Experiments = Readonly<{
  /**
   * Enables the handling of GET requests in the /open-debugger endpoint,
   * in addition to POST requests. GET requests respond by redirecting to
   * the debugger frontend, instead of opening it using the DevToolLauncher
   * interface.
   */
  enableOpenDebuggerRedirect: boolean,

  /**
   * Enables the Network panel in the debugger frontend.
   */
  // NOTE: Used by Expo, exposing a tab labelled "Network (Expo)"
  enableNetworkInspector: boolean,

  /**
   * Launch the debugger frontend in a standalone shell instead of a browser.
   * When this is enabled, we will use the optional launchDebuggerShell
   * method on the DevToolLauncher, or throw an error if the method is missing.
   *
   * NOTE: Disabling this also disables support for concurrent sessions in the
   * inspector proxy. Without the standalone shell, the proxy remains responsible
   * for keeping only one debugger frontend active at a time per page.
   */
  enableStandaloneFuseboxShell: boolean,
}>;

export type ExperimentsConfig = Partial<Experiments>;
