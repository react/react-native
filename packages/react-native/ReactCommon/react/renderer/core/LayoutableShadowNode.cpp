/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LayoutableShadowNode.h"

#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/core/LayoutMetrics.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/debug/DebugStringConvertibleItem.h>

namespace facebook::react {

template <class T>
using LayoutableSmallVector = std::vector<T>;

LayoutableShadowNode::LayoutableShadowNode(
    const ShadowNodeFragment& fragment,
    const ShadowNodeFamily::Shared& family,
    ShadowNodeTraits traits)
    : ShadowNode(fragment, family, traits), layoutMetrics_({}) {}

LayoutableShadowNode::LayoutableShadowNode(
    const ShadowNode& sourceShadowNode,
    const ShadowNodeFragment& fragment)
    : ShadowNode(sourceShadowNode, fragment),
      layoutMetrics_(
          static_cast<const LayoutableShadowNode&>(sourceShadowNode)
              .layoutMetrics_) {}

LayoutMetrics LayoutableShadowNode::computeLayoutMetricsFromRoot(
    const ShadowNodeFamily& descendantNodeFamily,
    const LayoutableShadowNode& rootNode,
    LayoutInspectingPolicy policy) {
  // Prelude.

  if (&descendantNodeFamily == &rootNode.getFamily()) {
    // If calculating layout for root node
    auto layoutMetrics = rootNode.getLayoutMetrics();
    if (layoutMetrics.displayType == DisplayType::None) {
      return EmptyLayoutMetrics;
    }
    if (policy.includeTransform) {
      layoutMetrics.frame = layoutMetrics.frame * rootNode.getTransform();
    }
    return layoutMetrics;
  }

  auto ancestors = descendantNodeFamily.getAncestors(rootNode);
  return computeRelativeLayoutMetrics(ancestors, policy);
}

LayoutMetrics LayoutableShadowNode::computeRelativeLayoutMetrics(
    const ShadowNodeFamily& descendantNodeFamily,
    const LayoutableShadowNode& ancestorNode,
    LayoutInspectingPolicy policy) {
  // Prelude.

  if (&descendantNodeFamily == &ancestorNode.getFamily()) {
    // Layout metrics of a node computed relatively to the same node are equal
    // to `transform`-ed layout metrics of the node with zero `origin`.
    auto layoutMetrics = ancestorNode.getLayoutMetrics();
    if (layoutMetrics.displayType == DisplayType::None) {
      return EmptyLayoutMetrics;
    }
    if (policy.includeTransform) {
      layoutMetrics.frame = layoutMetrics.frame * ancestorNode.getTransform();
    }
    layoutMetrics.frame.origin = {.x = 0, .y = 0};
    return layoutMetrics;
  }

  auto ancestors = descendantNodeFamily.getAncestors(ancestorNode);
  return computeRelativeLayoutMetrics(ancestors, policy);
}

LayoutMetrics LayoutableShadowNode::computeRelativeLayoutMetrics(
    const AncestorList& ancestors,
    LayoutInspectingPolicy policy) {
  if (ancestors.empty()) {
    // Specified nodes do not form an ancestor-descender relationship
    // in the same tree. Aborting.
    return EmptyLayoutMetrics;
  }

  // ------------------------------

  // Step 1.
  // Creating a list of nodes that form a chain from the descender node to
  // ancestor node inclusively.
  auto shadowNodeList = LayoutableSmallVector<const ShadowNode*>{};

  // Finding the measured node.
  // The last element in the `AncestorList` is a pair of a parent of the node
  // and an index of this node in the parent's children list.
  auto& pair = ancestors.at(ancestors.size() - 1);
  auto descendantNode = pair.first.get().getChildren().at(pair.second).get();

  // Putting the node inside the list.
  // Even if this is a node with a `RootNodeKind` trait, we don't treat it as
  // root because we measure it from an outside tree perspective.
  shadowNodeList.push_back(descendantNode);

  for (auto it = ancestors.rbegin(); it != ancestors.rend(); it++) {
    auto& shadowNode = it->first.get();

    shadowNodeList.push_back(&shadowNode);

    if (shadowNode.getTraits().check(ShadowNodeTraits::Trait::RootNodeKind)) {
      // If this is a node with a `RootNodeKind` trait, we need to stop right
      // there.
      break;
    }
  }

  // ------------------------------

  // Step 2.
  // Computing the initial size of the measured node.
  auto descendantLayoutableNode =
      dynamic_cast<const LayoutableShadowNode*>(descendantNode);

  if (descendantLayoutableNode == nullptr) {
    return EmptyLayoutMetrics;
  }

  auto layoutMetrics = descendantLayoutableNode->getLayoutMetrics();
  auto& resultFrame = layoutMetrics.frame;
  resultFrame.origin = {.x = 0, .y = 0};

  // Step 3.
  // Iterating on a list of nodes computing compound offset and size.
  auto size = shadowNodeList.size();
  for (size_t i = 0; i < size; i++) {
    auto currentShadowNode =
        dynamic_cast<const LayoutableShadowNode*>(shadowNodeList.at(i));

    if (currentShadowNode == nullptr) {
      return EmptyLayoutMetrics;
    }

    // Descendants of display: none don't have relative layout metrics.
    if (currentShadowNode->getLayoutMetrics().displayType ==
        DisplayType::None) {
      return EmptyLayoutMetrics;
    }

    auto currentFrame = currentShadowNode->getLayoutMetrics().frame;
    if (i == size - 1) {
      // If it's the last element, its origin is irrelevant.
      currentFrame.origin = {.x = 0, .y = 0};
    }

    auto isRootNode = currentShadowNode->getTraits().check(
        ShadowNodeTraits::Trait::RootNodeKind);

    auto shouldApplyTransformation = (policy.includeTransform && !isRootNode) ||
        (policy.includeViewportOffset && isRootNode);

    // Move frame to the coordinate space of the current node.
    resultFrame.origin += currentFrame.origin;

    if (shouldApplyTransformation) {
      // If a node has a transform, we need to use the center of that node as
      // the origin of the transform when transforming its children (which
      // affects the result of transforms like `scale` and `rotate`).
      resultFrame = currentShadowNode->getTransform().applyWithCenter(
          resultFrame, currentFrame.getCenter());
    }

    if (i != 0 && policy.includeTransform) {
      // Transformation is not applied here and instead we delegated out in
      // getContentOriginOffset. The reason is that for `ScrollViewShadowNode`,
      // we need to consider `scrollAwayPaddingTop` which should NOT be included
      // in the transform.
      resultFrame.origin += currentShadowNode->getContentOriginOffset(true);
    }

    if (policy.enableOverflowClipping &&
        (i != size - 1 || policy.clipSpecifiedAncestor)) {
      auto overflowInset = currentShadowNode->getLayoutMetrics().overflowInset;
      auto overflowRect = insetBy(
          currentFrame * currentShadowNode->getTransform(), overflowInset);
      resultFrame = Rect::intersect(resultFrame, overflowRect);
      if (resultFrame.size.width == 0 && resultFrame.size.height == 0) {
        return EmptyLayoutMetrics;
      }
    }
  }

  // ------------------------------

  return layoutMetrics;
}

LayoutMetrics LayoutableShadowNode::getLayoutMetrics() const {
  return layoutMetrics_;
}

void LayoutableShadowNode::setLayoutMetrics(LayoutMetrics layoutMetrics) {
  ensureUnsealed();

  if (layoutMetrics_ == layoutMetrics) {
    return;
  }

  layoutMetrics_ = layoutMetrics;
}

Transform LayoutableShadowNode::getTransform() const {
  return Transform::Identity();
}

Point LayoutableShadowNode::getContentOriginOffset(
    bool /*includeTransform*/) const {
  return {.x = 0, .y = 0};
}

bool LayoutableShadowNode::canBeTouchTarget() const {
  return false;
}

bool LayoutableShadowNode::canChildrenBeTouchTarget() const {
  return true;
}

LayoutableShadowNode::UnsharedList
LayoutableShadowNode::getLayoutableChildNodes() const {
  LayoutableShadowNode::UnsharedList layoutableChildren;
  for (const auto& childShadowNode : getChildren()) {
    auto layoutableChildShadowNode =
        dynamic_cast<const LayoutableShadowNode*>(childShadowNode.get());
    if (layoutableChildShadowNode != nullptr) {
      layoutableChildren.push_back(
          const_cast<LayoutableShadowNode*>(layoutableChildShadowNode));
    }
  }
  return layoutableChildren;
}

Size LayoutableShadowNode::measureContent(
    const LayoutContext& /*layoutContext*/,
    const LayoutConstraints& /*layoutConstraints*/) const {
  return {};
}

Size LayoutableShadowNode::measure(
    const LayoutContext& layoutContext,
    const LayoutConstraints& layoutConstraints) const {
  auto clonedShadowNode = clone({});
  auto& layoutableShadowNode =
      static_cast<LayoutableShadowNode&>(*clonedShadowNode);

  auto localLayoutContext = layoutContext;
  localLayoutContext.affectedNodes = nullptr;

  layoutableShadowNode.layoutTree(localLayoutContext, layoutConstraints);

  return layoutableShadowNode.getLayoutMetrics().frame.size;
}

Float LayoutableShadowNode::baseline(
    const LayoutContext& /*layoutContext*/,
    Size /*size*/) const {
  return 0;
}

std::shared_ptr<const ShadowNode> LayoutableShadowNode::findNodeAtPoint(
    const std::shared_ptr<const ShadowNode>& node,
    Point point) {
  auto layoutableShadowNode =
      dynamic_cast<const LayoutableShadowNode*>(node.get());

  if (layoutableShadowNode == nullptr) {
    return nullptr;
  }

  if (!layoutableShadowNode->canBeTouchTarget() &&
      !layoutableShadowNode->canChildrenBeTouchTarget()) {
    return nullptr;
  }

  auto layoutMetrics = layoutableShadowNode->getLayoutMetrics();
  auto transform = layoutableShadowNode->getTransform();
  auto transformedFrame = layoutMetrics.frame * transform;
  auto isPointInside = transformedFrame.containsPoint(point);

  if (isPointInside && !layoutableShadowNode->canChildrenBeTouchTarget()) {
    return node;
  } else if (!isPointInside) {
    auto overflowFrame =
        insetBy(layoutMetrics.frame, layoutMetrics.overflowInset);
    auto transformedOverflowFrame = overflowFrame * transform;
    // If child overflows parent, the touch may be intercepted by the child
    // only, so we should continue recursing.
    if (!transformedOverflowFrame.containsPoint(point)) {
      return nullptr;
    }
  }

  if (Transform::isVerticalInversion(transform) ||
      Transform::isHorizontalInversion(transform)) {
    auto centerX =
        transformedFrame.origin.x + transformedFrame.size.width / 2.0;
    auto centerY =
        transformedFrame.origin.y + transformedFrame.size.height / 2.0;

    auto relativeX = point.x - centerX;
    auto relativeY = point.y - centerY;

    if (Transform::isVerticalInversion(transform)) {
      relativeY = -relativeY;
    }
    if (Transform::isHorizontalInversion(transform)) {
      relativeX = -relativeX;
    }

    point.x = float(centerX + relativeX);
    point.y = float(centerY + relativeY);
  }

  auto newPoint = point - transformedFrame.origin -
      layoutableShadowNode->getContentOriginOffset(false);

  auto sortedChildren = node->getChildren();
  std::stable_sort(
      sortedChildren.begin(),
      sortedChildren.end(),
      [](const auto& lhs, const auto& rhs) -> bool {
        return lhs->getOrderIndex() < rhs->getOrderIndex();
      });

  for (auto it = sortedChildren.rbegin(); it != sortedChildren.rend(); it++) {
    const auto& childShadowNode = *it;
    auto hitView = findNodeAtPoint(childShadowNode, newPoint);
    if (hitView) {
      return hitView;
    }
  }
  return layoutableShadowNode->canBeTouchTarget() ? node : nullptr;
}

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList LayoutableShadowNode::getDebugProps() const {
  auto list = ShadowNode::getDebugProps();

  auto layoutInfo = SharedDebugStringConvertibleList{};

  if (!getIsLayoutClean()) {
    layoutInfo.push_back(std::make_shared<DebugStringConvertibleItem>("dirty"));
  }

  auto layoutMetrics = getLayoutMetrics();
  auto defaultLayoutMetrics = LayoutMetrics();

  layoutInfo.push_back(
      std::make_shared<DebugStringConvertibleItem>(
          "frame", toString(layoutMetrics.frame)));

  if (layoutMetrics.borderWidth != defaultLayoutMetrics.borderWidth) {
    layoutInfo.push_back(
        std::make_shared<DebugStringConvertibleItem>(
            "borderWidth", toString(layoutMetrics.borderWidth)));
  }

  if (layoutMetrics.contentInsets != defaultLayoutMetrics.contentInsets) {
    layoutInfo.push_back(
        std::make_shared<DebugStringConvertibleItem>(
            "contentInsets", toString(layoutMetrics.contentInsets)));
  }

  if (layoutMetrics.displayType == DisplayType::None) {
    layoutInfo.push_back(
        std::make_shared<DebugStringConvertibleItem>("hidden"));
  }

  if (layoutMetrics.layoutDirection == LayoutDirection::RightToLeft) {
    layoutInfo.push_back(std::make_shared<DebugStringConvertibleItem>("rtl"));
  }

  list.push_back(
      std::make_shared<DebugStringConvertibleItem>("layout", "", layoutInfo));

  return list;
}
#endif

} // namespace facebook::react
