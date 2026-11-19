/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "CullingContext.h"
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/components/scrollview/ScrollViewShadowNode.h>
#include <react/renderer/core/LayoutableShadowNode.h>
#include "ShadowViewNodePair.h"

namespace facebook::react {

bool CullingContext::shouldConsiderCulling() const {
  return frame.size.width > 0 && frame.size.height > 0;
}

CullingContext CullingContext::adjustCullingContextIfNeeded(
    const ShadowViewNodePair& pair) const {
  auto cullingContext = *this;
  if (ReactNativeFeatureFlags::enableViewCulling()) {
    if (auto scrollViewShadowNode =
            dynamic_cast<const ScrollViewShadowNode*>(pair.shadowNode)) {
      if (scrollViewShadowNode->getConcreteProps().yogaStyle.overflow() !=
              yoga::Overflow::Visible &&
          !scrollViewShadowNode->getStateData().disableViewCulling) {
        cullingContext.frame.origin =
            -scrollViewShadowNode->getContentOriginOffset(
                /* includeTransform */ true);
        cullingContext.frame.size =
            scrollViewShadowNode->getLayoutMetrics().frame.size;

        // Enlarge the frame if an outset ratio is defined
        auto outsetRatio = ReactNativeFeatureFlags::viewCullingOutsetRatio();
        if (outsetRatio > 0) {
          auto xOutset = static_cast<float>(
              floor(cullingContext.frame.size.width * outsetRatio));
          auto yOutset = static_cast<float>(
              floor(cullingContext.frame.size.height * outsetRatio));
          cullingContext.frame.origin.x -= xOutset;
          cullingContext.frame.origin.y -= yOutset;
          cullingContext.frame.size.width += 2.0f * xOutset;
          cullingContext.frame.size.height += 2.0f * yOutset;
        }

        cullingContext.transform = Transform::Identity();

#ifdef ANDROID
        auto layoutMetrics = scrollViewShadowNode->getLayoutMetrics();
        if (layoutMetrics.layoutDirection == LayoutDirection::RightToLeft) {
          // In RTL, content offset is flipped horizontally.
          // We need to flip the culling context frame to match.
          auto stateData = scrollViewShadowNode->getStateData();
          cullingContext.frame.origin.x =
              stateData.contentBoundingRect.size.width -
              layoutMetrics.frame.size.width - cullingContext.frame.origin.x;
        }
#endif
      } else {
        cullingContext = {};
      }
    } else if (pair.shadowView.traits.check(
                   ShadowNodeTraits::Trait::RootNodeKind)) {
      cullingContext = {};
    } else {
      cullingContext.frame.origin -= pair.shadowView.layoutMetrics.frame.origin;

      if (auto layoutableShadowNode =
              dynamic_cast<const LayoutableShadowNode*>(pair.shadowNode)) {
        cullingContext.transform =
            cullingContext.transform * layoutableShadowNode->getTransform();
      }
    }
  }

  return cullingContext;
}
} // namespace facebook::react
