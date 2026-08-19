/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

#include <react/renderer/components/scrollview/HostPlatformScrollViewProps.h>

namespace facebook::react {
using ScrollViewProps = HostPlatformScrollViewProps;
using SharedScrollViewProps = std::shared_ptr<const ScrollViewProps>;
} // namespace facebook::react
