/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

#include <react/renderer/components/scrollview/ScrollViewEventEmitter.h>
#include <react/renderer/components/scrollview/ScrollViewState.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/core/LayoutContext.h>

namespace facebook::react {

extern const char AndroidHorizontalScrollContentViewShadowNodeComponentName[];

class AndroidHorizontalScrollContentViewShadowNode final
    : public ConcreteViewShadowNode<
          AndroidHorizontalScrollContentViewShadowNodeComponentName,
          ViewProps,
          ScrollViewEventEmitter,
          ScrollViewState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;
  void layout(LayoutContext layoutContext) override;
};

} // namespace facebook::react
