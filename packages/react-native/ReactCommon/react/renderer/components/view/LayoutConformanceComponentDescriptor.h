/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <React/RendererCore.h>
#include <react/renderer/components/view/LayoutConformanceShadowNode.h>

namespace facebook::react {

using LayoutConformanceComponentDescriptor = ConcreteComponentDescriptor<LayoutConformanceShadowNode>;

} // namespace facebook::react
