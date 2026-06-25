/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeTargetTracingStateObserver.h"

#include <jsinspector-modern/RuntimeTargetGlobalStateObserver.h>

namespace facebook::react::jsinspector_modern {

void installTracingStateObserver(jsi::Runtime& runtime) {
  installGlobalStateObserver(
      runtime,
      "__TRACING_STATE_OBSERVER__",
      "isTracing",
      "onTracingStateChange");
}

void emitTracingStateObserverChange(jsi::Runtime& runtime, bool isTracing) {
  emitGlobalStateObserverChange(
      runtime, "__TRACING_STATE_OBSERVER__", "onTracingStateChange", isTracing);
}

} // namespace facebook::react::jsinspector_modern
