/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LayoutEventEmitter.h"

#include <cxxreact/TraceSection.h>
#include <react/renderer/components/view/ViewShadowNode.h>
#include <react/renderer/core/LayoutableShadowNode.h>

namespace facebook::react {

void LayoutEventEmitter::shadowTreeDidCommit(
    const ShadowTree& /*shadowTree*/,
    const RootShadowNode::Shared& /*rootShadowNode*/,
    const std::vector<const LayoutableShadowNode*>&
        affectedLayoutableNodes) noexcept {
  TraceSection s(
      "LayoutEventEmitter::shadowTreeDidCommit",
      "affectedLayoutableNodes",
      affectedLayoutableNodes.size());

  for (const auto* layoutableNode : affectedLayoutableNodes) {
    if (auto viewProps =
            dynamic_cast<const ViewProps*>(layoutableNode->getProps().get())) {
      if (viewProps->onLayout) {
        static_cast<const BaseViewEventEmitter&>(
            *layoutableNode->getEventEmitter())
            .onLayout(layoutableNode->getLayoutMetrics());
      }
    }
  }
}

} // namespace facebook::react
