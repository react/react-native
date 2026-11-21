/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/PrivateGuard.h>

#include <React/RendererCore.h>
#include <React/View.h>
#include <react/renderer/components/scrollview/ScrollViewEventEmitter.h>
#include <react/renderer/components/scrollview/ScrollViewState.h>

namespace facebook::react {

extern const char AndroidHorizontalScrollContentViewShadowNodeComponentName[];

class AndroidHorizontalScrollContentViewShadowNode final
    : public ConcreteViewShadowNode<
          AndroidHorizontalScrollContentViewShadowNodeComponentName,
          ViewProps,
          ScrollViewEventEmitter,
          ScrollViewState> {
 public:
  AndroidHorizontalScrollContentViewShadowNode(
      const ShadowNodeFragment &fragment,
      const ShadowNodeFamily::Shared &family,
      ShadowNodeTraits traits);

  AndroidHorizontalScrollContentViewShadowNode(const ShadowNode &sourceShadowNode, const ShadowNodeFragment &fragment);

  void layout(LayoutContext layoutContext) override;

 private:
  void initialize() noexcept;
};

} // namespace facebook::react
