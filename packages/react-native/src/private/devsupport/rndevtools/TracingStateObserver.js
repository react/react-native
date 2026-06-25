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
  '__TRACING_STATE_OBSERVER__',
  'isTracing',
);

const TracingStateObserver = {
  isTracing(): boolean {
    return observer.getStatus();
  },

  subscribe(callback: (isTracing: boolean) => void): () => void {
    return observer.subscribe(callback);
  },
};

export default TracingStateObserver;
