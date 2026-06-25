/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import GlobalStateObserver from './GlobalStateObserver';

const observer = new GlobalStateObserver(
  '__DEBUGGER_SESSION_OBSERVER__',
  'hasActiveSession',
);

const FuseboxSessionObserver = {
  hasActiveSession(): boolean {
    return observer.getStatus();
  },

  subscribe(callback: (status: boolean) => void): () => void {
    return observer.subscribe(callback);
  },
};

export default FuseboxSessionObserver;
