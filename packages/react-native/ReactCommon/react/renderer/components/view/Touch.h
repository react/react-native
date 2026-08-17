/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

#include <react/renderer/components/view/HostPlatformTouch.h>

namespace facebook::react {
using Touch = HostPlatformTouch;
using Touches = std::unordered_set<Touch, Touch::Hasher, Touch::Comparator>;
} // namespace facebook::react
