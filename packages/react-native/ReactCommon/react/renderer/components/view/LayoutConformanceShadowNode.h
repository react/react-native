/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <React/View.h>
#include <react/renderer/components/view/LayoutConformanceProps.h>

namespace facebook::react {

// NOLINTNEXTLINE(facebook-hte-CArray,modernize-avoid-c-arrays)
extern const char LayoutConformanceShadowNodeComponentName[];

class LayoutConformanceShadowNode final : public ConcreteShadowNode<
                                              LayoutConformanceShadowNodeComponentName,
                                              YogaLayoutableShadowNode,
                                              LayoutConformanceProps> {
 public:
  using ConcreteShadowNode::ConcreteShadowNode;
};

} // namespace facebook::react
