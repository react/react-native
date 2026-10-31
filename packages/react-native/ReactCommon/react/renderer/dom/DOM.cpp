/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DOM.h"
#include <react/renderer/components/text/RawTextShadowNode.h>
#include <react/renderer/core/LayoutMetrics.h>
#include <react/renderer/graphics/Point.h>
#include <react/renderer/graphics/Rect.h>
#include <react/renderer/graphics/Size.h>
#include <cmath>

namespace facebook::react::dom {

namespace {

std::shared_ptr<const ShadowNode> getShadowNodeInRevision(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode) {
  // If the given shadow node is of the same family as the root shadow node,
  // return the latest root shadow node
  if (ShadowNode::sameFamily(*currentRevision, shadowNode)) {
    return currentRevision;
  }

  auto ancestors = shadowNode.getFamily().getAncestors(*currentRevision);

  if (ancestors.empty()) {
    return nullptr;
  }

  auto pair = ancestors.rbegin();
  return pair->first.get().getChildren().at(pair->second);
}

std::shared_ptr<const ShadowNode> getParentShadowNodeInRevision(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode) {
  // If the given shadow node is of the same family as the root shadow node,
  // return the latest root shadow node
  if (ShadowNode::sameFamily(*currentRevision, shadowNode)) {
    return currentRevision;
  }

  auto ancestors = shadowNode.getFamily().getAncestors(*currentRevision);

  if (ancestors.empty()) {
    return nullptr;
  }

  if (ancestors.size() == 1) {
    // The parent is the shadow root
    return currentRevision;
  }

  auto parentOfParentPair = ancestors[ancestors.size() - 2];
  return parentOfParentPair.first.get().getChildren().at(
      parentOfParentPair.second);
}

std::shared_ptr<const ShadowNode> getPositionedAncestorOfShadowNodeInRevision(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode) {
  auto ancestors = shadowNode.getFamily().getAncestors(*currentRevision);

  if (ancestors.empty()) {
    // The node is no longer part of an active shadow tree, or is the root.
    return nullptr;
  }

  if (ancestors.size() == 1) {
    // The parent is the root
    return currentRevision;
  }

  for (auto it = ancestors.rbegin(); it != ancestors.rend(); it++) {
    const auto layoutableAncestorShadowNode =
        dynamic_cast<const LayoutableShadowNode*>(&(it->first.get()));
    if (layoutableAncestorShadowNode == nullptr) {
      return nullptr;
    }
    if (layoutableAncestorShadowNode->getLayoutMetrics().positionType !=
        PositionType::Static) {
      // We have found our nearest positioned ancestor, now to get a shared
      // pointer of it
      it++;
      return it == ancestors.rend()
          ? currentRevision
          : it->first.get().getChildren().at(it->second);
    }
  }

  // If there is no positioned ancestor then we just consider the root
  // to be one
  return currentRevision;
}

void getTextContentInShadowNode(
    const ShadowNode& shadowNode,
    std::string& result) {
  auto rawTextShadowNode = dynamic_cast<const RawTextShadowNode*>(&shadowNode);

  if (rawTextShadowNode != nullptr) {
    result.append(rawTextShadowNode->getConcreteProps().text);
  }

  for (const auto& childNode : shadowNode.getChildren()) {
    getTextContentInShadowNode(*childNode, result);
  }
}

LayoutMetrics getLayoutMetricsFromRoot(
    const ShadowNode& ancestorNode,
    const ShadowNode& shadowNode,
    LayoutableShadowNode::LayoutInspectingPolicy policy) {
  auto layoutableAncestorShadowNode =
      dynamic_cast<const LayoutableShadowNode*>(&ancestorNode);

  if (layoutableAncestorShadowNode == nullptr) {
    return EmptyLayoutMetrics;
  }

  return LayoutableShadowNode::computeLayoutMetricsFromRoot(
      shadowNode.getFamily(), *layoutableAncestorShadowNode, policy);
}

Rect getScrollableContentBounds(
    Rect contentBounds,
    LayoutMetrics layoutMetrics) {
  auto paddingFrame = layoutMetrics.getPaddingFrame();

  auto paddingBottom =
      layoutMetrics.contentInsets.bottom - layoutMetrics.borderWidth.bottom;
  auto paddingLeft =
      layoutMetrics.contentInsets.left - layoutMetrics.borderWidth.left;
  auto paddingRight =
      layoutMetrics.contentInsets.right - layoutMetrics.borderWidth.right;

  auto minY = paddingFrame.getMinY();
  auto maxY =
      std::max(paddingFrame.getMaxY(), contentBounds.getMaxY() + paddingBottom);

  auto minX = layoutMetrics.layoutDirection == LayoutDirection::RightToLeft
      ? std::min(paddingFrame.getMinX(), contentBounds.getMinX() - paddingLeft)
      : paddingFrame.getMinX();
  auto maxX = layoutMetrics.layoutDirection == LayoutDirection::RightToLeft
      ? paddingFrame.getMaxX()
      : std::max(
            paddingFrame.getMaxX(), contentBounds.getMaxX() + paddingRight);

  return Rect{
      .origin = Point{.x = minX, .y = minY},
      .size = Size{.width = maxX - minX, .height = maxY - minY}};
}

} // namespace

std::shared_ptr<const ShadowNode> getElementById(
    const std::shared_ptr<const ShadowNode>& shadowNode,
    const std::string& id) {
  if (shadowNode->getProps()->nativeId == id) {
    return shadowNode;
  }

  for (const auto& childNode : shadowNode->getChildren()) {
    auto result = getElementById(childNode, id);
    if (result != nullptr) {
      return result;
    }
  }

  return nullptr;
}

std::shared_ptr<const ShadowNode> getParentNode(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode) {
  return getParentShadowNodeInRevision(currentRevision, shadowNode);
}

std::vector<std::shared_ptr<const ShadowNode>> getChildNodes(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode) {
  auto shadowNodeInCurrentRevision =
      getShadowNodeInRevision(currentRevision, shadowNode);
  if (shadowNodeInCurrentRevision == nullptr) {
    return {};
  }

  return shadowNodeInCurrentRevision->getChildren();
}

bool isConnected(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode) {
  auto shadowNodeInCurrentRevision =
      getShadowNodeInRevision(currentRevision, shadowNode);
  return shadowNodeInCurrentRevision != nullptr;
}

uint_fast16_t compareDocumentPosition(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode,
    const ShadowNode& otherShadowNode) {
  if (shadowNode.getSurfaceId() != otherShadowNode.getSurfaceId()) {
    return DOCUMENT_POSITION_DISCONNECTED;
  }

  // Quick check for node vs. itself
  if (&shadowNode == &otherShadowNode) {
    return 0;
  }

  auto ancestors = shadowNode.getFamily().getAncestors(*currentRevision);
  if (ancestors.empty()) {
    if (ShadowNode::sameFamily(*currentRevision, shadowNode)) {
      // shadowNode is the root
      return DOCUMENT_POSITION_CONTAINED_BY | DOCUMENT_POSITION_FOLLOWING;
    }
    return DOCUMENT_POSITION_DISCONNECTED;
  }

  auto otherAncestors =
      otherShadowNode.getFamily().getAncestors(*currentRevision);
  if (otherAncestors.empty()) {
    if (ShadowNode::sameFamily(*currentRevision, otherShadowNode)) {
      // otherShadowNode is the root
      return DOCUMENT_POSITION_CONTAINS | DOCUMENT_POSITION_PRECEDING;
    }
    return DOCUMENT_POSITION_DISCONNECTED;
  }

  // Consume all common ancestors
  size_t i = 0;
  while (i < ancestors.size() && i < otherAncestors.size() &&
         ancestors[i].second == otherAncestors[i].second) {
    i++;
  }

  if (i == ancestors.size()) {
    return (DOCUMENT_POSITION_CONTAINED_BY | DOCUMENT_POSITION_FOLLOWING);
  }

  if (i == otherAncestors.size()) {
    return (DOCUMENT_POSITION_CONTAINS | DOCUMENT_POSITION_PRECEDING);
  }

  if (ancestors[i].second > otherAncestors[i].second) {
    return DOCUMENT_POSITION_PRECEDING;
  }

  return DOCUMENT_POSITION_FOLLOWING;
}

std::string getTextContent(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode) {
  std::string result;

  auto shadowNodeInCurrentRevision =
      getShadowNodeInRevision(currentRevision, shadowNode);

  if (shadowNodeInCurrentRevision != nullptr) {
    getTextContentInShadowNode(*shadowNodeInCurrentRevision, result);
  }

  return result;
}

DOMRect getBoundingClientRect(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode,
    bool includeTransform,
    const LayoutableShadowNode::TransformOverrideProvider*
        transformOverrideProvider) {
  auto shadowNodeInCurrentRevision =
      getShadowNodeInRevision(currentRevision, shadowNode);
  if (shadowNodeInCurrentRevision == nullptr) {
    return DOMRect{};
  }

  auto layoutMetrics = getLayoutMetricsFromRoot(
      *currentRevision,
      shadowNode,
      {.includeTransform = includeTransform,
       .includeViewportOffset = true,
       .transformOverrideProvider = transformOverrideProvider});

  if (layoutMetrics == EmptyLayoutMetrics) {
    return DOMRect{};
  }

  auto frame = layoutMetrics.frame;
  return DOMRect{
      .x = frame.origin.x,
      .y = frame.origin.y,
      .width = frame.size.width,
      .height = frame.size.height};
}

DOMOffset getOffset(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode) {
  auto shadowNodeInCurrentRevision =
      getShadowNodeInRevision(currentRevision, shadowNode);
  auto positionedAncestorOfShadowNodeInCurrentRevision =
      getPositionedAncestorOfShadowNodeInRevision(currentRevision, shadowNode);

  // The node is no longer part of an active shadow tree, or it is the
  // root node
  if (shadowNodeInCurrentRevision == nullptr ||
      positionedAncestorOfShadowNodeInCurrentRevision == nullptr) {
    return DOMOffset{};
  }

  // If the node is not displayed (itself or any of its ancestors has
  // "display: none"), this returns an empty layout metrics object.
  auto shadowNodeLayoutMetricsRelativeToRoot = getLayoutMetricsFromRoot(
      *currentRevision, shadowNode, {.includeTransform = false});
  if (shadowNodeLayoutMetricsRelativeToRoot == EmptyLayoutMetrics) {
    return DOMOffset{};
  }

  auto positionedAncestorLayoutMetricsRelativeToRoot = getLayoutMetricsFromRoot(
      *currentRevision,
      *positionedAncestorOfShadowNodeInCurrentRevision,
      {.includeTransform = false});
  if (positionedAncestorLayoutMetricsRelativeToRoot == EmptyLayoutMetrics) {
    return DOMOffset{};
  }

  auto shadowNodeOriginRelativeToRoot =
      shadowNodeLayoutMetricsRelativeToRoot.frame.origin;
  auto positionedAncestorOriginRelativeToRoot =
      positionedAncestorLayoutMetricsRelativeToRoot.frame.origin;

  // On the Web, offsets are computed from the inner border of the
  // parent.
  auto offsetTop = shadowNodeOriginRelativeToRoot.y -
      positionedAncestorOriginRelativeToRoot.y -
      positionedAncestorLayoutMetricsRelativeToRoot.borderWidth.top;
  auto offsetLeft = shadowNodeOriginRelativeToRoot.x -
      positionedAncestorOriginRelativeToRoot.x -
      positionedAncestorLayoutMetricsRelativeToRoot.borderWidth.left;

  return DOMOffset{
      .offsetParent = positionedAncestorOfShadowNodeInCurrentRevision,
      .top = offsetTop,
      .left = offsetLeft};
}

DOMPoint getScrollPosition(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode) {
  auto shadowNodeInCurrentRevision =
      getShadowNodeInRevision(currentRevision, shadowNode);
  if (shadowNodeInCurrentRevision == nullptr) {
    return DOMPoint{};
  }

  // If the node is not displayed (itself or any of its ancestors has
  // "display: none"), this returns an empty layout metrics object.
  auto layoutMetrics = getLayoutMetricsFromRoot(
      *currentRevision,
      *shadowNodeInCurrentRevision,
      {.includeTransform = true});

  if (layoutMetrics == EmptyLayoutMetrics) {
    return DOMPoint{};
  }

  auto layoutableShadowNode = dynamic_cast<const LayoutableShadowNode*>(
      shadowNodeInCurrentRevision.get());
  // This should never happen
  if (layoutableShadowNode == nullptr) {
    return DOMPoint{};
  }

  auto scrollPosition = layoutableShadowNode->getContentOriginOffset(false);

  return DOMPoint{
      .x = scrollPosition.x == 0 ? 0 : -scrollPosition.x,
      .y = scrollPosition.y == 0 ? 0 : -scrollPosition.y};
}

DOMSizeRounded getScrollSize(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode) {
  auto shadowNodeInCurrentRevision =
      getShadowNodeInRevision(currentRevision, shadowNode);
  if (shadowNodeInCurrentRevision == nullptr) {
    return DOMSizeRounded{};
  }

  // If the node is not displayed (itself or any of its ancestors has
  // "display: none"), this returns an empty layout metrics object.
  auto layoutMetrics = getLayoutMetricsFromRoot(
      *currentRevision,
      *shadowNodeInCurrentRevision,
      {.includeTransform = false});

  if (layoutMetrics == EmptyLayoutMetrics) {
    return DOMSizeRounded{};
  }

  auto layoutableShadowNode = dynamic_cast<const YogaLayoutableShadowNode*>(
      shadowNodeInCurrentRevision.get());
  // This should never happen
  if (layoutableShadowNode == nullptr) {
    return DOMSizeRounded{};
  }

  Size scrollSize = getScrollableContentBounds(
                        layoutableShadowNode->getContentBounds(), layoutMetrics)
                        .size;

  return DOMSizeRounded{
      .width = static_cast<int>(std::round(scrollSize.width)),
      .height = static_cast<int>(std::round(scrollSize.height))};
}

DOMSizeRounded getInnerSize(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode) {
  auto shadowNodeInCurrentRevision =
      getShadowNodeInRevision(currentRevision, shadowNode);
  if (shadowNodeInCurrentRevision == nullptr) {
    return DOMSizeRounded{};
  }

  // If the node is not displayed (itself or any of its ancestors has
  // "display: none"), this returns an empty layout metrics object.
  auto layoutMetrics = getLayoutMetricsFromRoot(
      *currentRevision,
      *shadowNodeInCurrentRevision,
      {.includeTransform = false});

  if (layoutMetrics == EmptyLayoutMetrics) {
    return DOMSizeRounded{};
  }

  auto paddingFrame = layoutMetrics.getPaddingFrame();

  return DOMSizeRounded{
      .width = static_cast<int>(std::round(paddingFrame.size.width)),
      .height = static_cast<int>(std::round(paddingFrame.size.height))};
}

DOMBorderWidthRounded getBorderWidth(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode) {
  auto shadowNodeInCurrentRevision =
      getShadowNodeInRevision(currentRevision, shadowNode);
  if (shadowNodeInCurrentRevision == nullptr) {
    return DOMBorderWidthRounded{};
  }

  // If the node is not displayed (itself or any of its ancestors has
  // "display: none"), this returns an empty layout metrics object.
  auto layoutMetrics = getLayoutMetricsFromRoot(
      *currentRevision,
      *shadowNodeInCurrentRevision,
      {.includeTransform = false});

  if (layoutMetrics == EmptyLayoutMetrics) {
    return DOMBorderWidthRounded{};
  }

  return DOMBorderWidthRounded{
      .top = static_cast<int>(std::round(layoutMetrics.borderWidth.top)),
      .right = static_cast<int>(std::round(layoutMetrics.borderWidth.right)),
      .bottom = static_cast<int>(std::round(layoutMetrics.borderWidth.bottom)),
      .left = static_cast<int>(std::round(layoutMetrics.borderWidth.left))};
}

std::string getTagName(const ShadowNode& shadowNode) {
  std::string canonicalComponentName = shadowNode.getComponentName();

  // FIXME(T162807327): Remove Android-specific prefixes and unify
  // shadow node implementations
  if (canonicalComponentName == "AndroidTextInput") {
    canonicalComponentName = "TextInput";
  } else if (canonicalComponentName == "AndroidSwitch") {
    canonicalComponentName = "Switch";
  }

  // Prefix with RN:
  canonicalComponentName.insert(0, "RN:");

  return canonicalComponentName;
}

RNMeasureRect measure(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode,
    const LayoutableShadowNode::TransformOverrideProvider*
        transformOverrideProvider) {
  auto shadowNodeInCurrentRevision =
      getShadowNodeInRevision(currentRevision, shadowNode);
  if (shadowNodeInCurrentRevision == nullptr) {
    return RNMeasureRect{};
  }

  auto layoutMetrics = getLayoutMetricsFromRoot(
      *currentRevision,
      *shadowNodeInCurrentRevision,
      {.includeTransform = true,
       .includeViewportOffset = false,
       .transformOverrideProvider = transformOverrideProvider});

  if (layoutMetrics == EmptyLayoutMetrics) {
    return RNMeasureRect{};
  }

  auto layoutableShadowNode = dynamic_cast<const LayoutableShadowNode*>(
      shadowNodeInCurrentRevision.get());
  Point originRelativeToParent = layoutableShadowNode != nullptr
      ? layoutableShadowNode->getLayoutMetrics().frame.origin
      : Point();

  auto frame = layoutMetrics.frame;

  return RNMeasureRect{
      .x = originRelativeToParent.x,
      .y = originRelativeToParent.y,
      .width = frame.size.width,
      .height = frame.size.height,
      .pageX = frame.origin.x,
      .pageY = frame.origin.y};
}

DOMRect measureInWindow(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode,
    const LayoutableShadowNode::TransformOverrideProvider*
        transformOverrideProvider) {
  auto shadowNodeInCurrentRevision =
      getShadowNodeInRevision(currentRevision, shadowNode);
  if (shadowNodeInCurrentRevision == nullptr) {
    return DOMRect{};
  }

  auto layoutMetrics = getLayoutMetricsFromRoot(
      *currentRevision,
      *shadowNodeInCurrentRevision,
      {.includeTransform = true,
       .includeViewportOffset = true,
       .transformOverrideProvider = transformOverrideProvider});

  if (layoutMetrics == EmptyLayoutMetrics) {
    return DOMRect{};
  }

  auto frame = layoutMetrics.frame;
  return DOMRect{
      .x = frame.origin.x,
      .y = frame.origin.y,
      .width = frame.size.width,
      .height = frame.size.height,
  };
}

std::optional<DOMRect> measureLayout(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode,
    const ShadowNode& relativeToShadowNode) {
  auto shadowNodeInCurrentRevision =
      getShadowNodeInRevision(currentRevision, shadowNode);
  if (shadowNodeInCurrentRevision == nullptr) {
    return std::nullopt;
  }

  auto relativeToShadowNodeInCurrentRevision =
      getShadowNodeInRevision(currentRevision, relativeToShadowNode);
  if (relativeToShadowNodeInCurrentRevision == nullptr) {
    return std::nullopt;
  }

  auto layoutMetrics = getLayoutMetricsFromRoot(
      *relativeToShadowNodeInCurrentRevision,
      *shadowNodeInCurrentRevision,
      {.includeTransform = false});

  if (layoutMetrics == EmptyLayoutMetrics) {
    return std::nullopt;
  }

  auto frame = layoutMetrics.frame;

  return DOMRect{
      .x = frame.origin.x,
      .y = frame.origin.y,
      .width = frame.size.width,
      .height = frame.size.height,
  };
}

} // namespace facebook::react::dom
