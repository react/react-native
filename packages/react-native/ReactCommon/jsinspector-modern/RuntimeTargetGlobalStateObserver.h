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
 * Installs a global state observer object on the JavaScript runtime's global
 * object. The observer has a boolean status property, a Set of subscribers,
 * and a callback that updates the status and notifies subscribers.
 *
 * @param globalName The name of the global object (e.g.,
 *   "__DEBUGGER_SESSION_OBSERVER__").
 * @param statusProperty The name of the boolean property (e.g.,
 *   "hasActiveSession").
 * @param callbackName The name of the state change callback (e.g.,
 *   "onSessionStatusChange").
 */
void installGlobalStateObserver(
    jsi::Runtime &runtime,
    const char *globalName,
    const char *statusProperty,
    const char *callbackName);

/**
 * Emits a state change to an installed global state observer by calling its
 * callback function.
 *
 * @param globalName The name of the global object.
 * @param callbackName The name of the state change callback.
 * @param value The new boolean state value.
 */
void emitGlobalStateObserverChange(jsi::Runtime &runtime, const char *globalName, const char *callbackName, bool value);

} // namespace facebook::react::jsinspector_modern
