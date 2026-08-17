/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

#include <react/renderer/components/view/HostPlatformViewEventEmitter.h>

namespace facebook::react {
using ViewEventEmitter = HostPlatformViewEventEmitter;
using SharedViewEventEmitter = std::shared_ptr<const ViewEventEmitter>;
} // namespace facebook::react
