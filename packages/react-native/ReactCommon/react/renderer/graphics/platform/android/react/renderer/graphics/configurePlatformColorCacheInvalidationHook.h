/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/cxxstableapi/UmbrellaGuard.h>

#include <functional>

namespace facebook::react {
void configurePlatformColorCacheInvalidationHook(std::function<void()> &&hook);
} // namespace facebook::react
