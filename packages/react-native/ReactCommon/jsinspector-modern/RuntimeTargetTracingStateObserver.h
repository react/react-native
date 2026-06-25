/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>

namespace facebook::react::jsinspector_modern {

/**
 * Installs __TRACING_STATE_OBSERVER__ object on the JavaScript's global
 * object, which can be referenced from JavaScript side for determining the
 * status of performance tracing.
 */
void installTracingStateObserver(jsi::Runtime &runtime);

/**
 * Emits the tracing state change to JavaScript by calling onTracingStateChange
 * on __TRACING_STATE_OBSERVER__.
 */
void emitTracingStateObserverChange(jsi::Runtime &runtime, bool isTracing);

} // namespace facebook::react::jsinspector_modern
