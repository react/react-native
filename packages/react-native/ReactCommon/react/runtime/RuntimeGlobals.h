/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <folly/dynamic.h>
#include <react/runtime/ReactInstance.h>

namespace facebook::react {

/**
 * Synchronously assigns each entry of `globals` to a property of `globalThis`.
 * Must be called on the runtime's JavaScript thread. `globals` must be an object
 * with string keys. Each call creates new JavaScript values from the input.
 */
void installRuntimeGlobals(jsi::Runtime &runtime, const folly::dynamic &globals);

/**
 * Returns a bindings install function that assigns each entry of `globals` to a
 * property of `globalThis`, then runs `additionalBindings` if it is set.
 *
 * `globals` must be an object with string keys. Each invocation converts the
 * same values again, so every runtime receives its own JavaScript objects.
 */
ReactInstance::BindingsInstallFunc createRuntimeGlobalsInstaller(
    folly::dynamic globals,
    ReactInstance::BindingsInstallFunc additionalBindings = {});

} // namespace facebook::react
