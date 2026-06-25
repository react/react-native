/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/debug/flags.h>
#include <functional>
#include <memory>
#include <string>

namespace facebook::react {

class PlatformTimerRegistry;

struct ReactInstanceConfig {
  std::string appId;
  std::string deviceName;
#ifdef REACT_NATIVE_DEBUG
  bool enableDevMode{true};
  bool enableInspector{true};
#else
  bool enableDevMode{false};
  bool enableInspector{false};
#endif
  std::string devServerHost{"localhost"};
  uint32_t devServerPort{8081};

  // Optional factory used to create the PlatformTimerRegistry for the instance.
  // When unset, a default thread-based PlatformTimerRegistryImpl is used. This
  // is a seam for tests (e.g. Fantom) to inject a deterministic, mockable timer
  // registry.
  std::function<std::unique_ptr<PlatformTimerRegistry>()> platformTimerRegistryFactory{nullptr};
};

} // namespace facebook::react
