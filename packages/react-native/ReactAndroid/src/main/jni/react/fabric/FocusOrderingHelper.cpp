/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FocusOrderingHelper.h"
#include <react/renderer/uimanager/UIManager.h>

#include <algorithm>
#include <vector>

namespace facebook::react {

int majorAxisDistanceRaw(
    FocusDirection focusDirection,
    Rect source,
    Rect dest) {
  switch (focusDirection) {
    case FocusDirection::FocusLeft:
      return static_cast<int>(
          source.origin.x - (dest.origin.x + dest.size.width));
    case FocusDirection::FocusRight:
      return static_cast<int>(
          dest.origin.x - (source.origin.x + source.size.width));
    case FocusDirection::FocusUp:
      return static_cast<int>(
          source.origin.y - (dest.origin.y + dest.size.height));
    case FocusDirection::FocusDown:
      return static_cast<int>(
          dest.origin.y - (source.origin.y + source.size.height));
    default:
      return INT_MAX;
  }
}

int majorAxisDistance(FocusDirection focusDirection, Rect source, Rect dest) {
  return std::max(0, majorAxisDistanceRaw(focusDirection, source, dest));
}

int minorAxisDistance(FocusDirection direction, Rect source, Rect dest) {
  switch (direction) {
    case FocusDirection::FocusLeft:
    case FocusDirection::FocusRight:
      // the distance between the center verticals
      return static_cast<int>(abs((source.getMidY() - dest.getMidY())));
    case FocusDirection::FocusUp:
    case FocusDirection::FocusDown:
      // the distance between the center horizontals
      return static_cast<int>(abs((source.getMidX() - dest.getMidX())));
    default:
      return INT_MAX;
  }
}

// 13 is a magic number that comes from Android's implementation. We opt to use
// this to get the same focus ordering as Android. See:
// https://cs.android.com/android/platform/superproject/main/+/main:frameworks/base/core/java/android/view/FocusFinder.java;l=547
double getWeightedDistanceFor(
    double majorAxisDistance,
    double minorAxisDistance) {
  return 13.0 * majorAxisDistance * majorAxisDistance +
      minorAxisDistance * minorAxisDistance;
}

// Make sure dest rect is actually on the direction of focus
bool isCandidate(Rect source, Rect dest, FocusDirection focusDirection) {
  switch (focusDirection) {
    case FocusDirection::FocusLeft:
      return ((source.origin.x + source.size.width) >
                  (dest.origin.x + dest.size.width) ||
              source.origin.x >= (dest.origin.x + dest.size.width)) &&
          source.origin.x > dest.origin.x;
    case FocusDirection::FocusRight:
      return (source.origin.x < dest.origin.x ||
              (source.origin.x + source.size.width) <= dest.origin.x) &&
          (source.origin.x + source.size.width) <
          (dest.origin.x + dest.size.width);
    case FocusDirection::FocusUp:
      return ((source.origin.y + source.size.height) >
                  (dest.origin.y + dest.size.height) ||
              source.origin.y >= (dest.origin.y + dest.size.height)) &&
          source.origin.y > dest.origin.y;
    case FocusDirection::FocusDown:
      return (source.origin.y < dest.origin.y ||
              (source.origin.y + source.size.height) <= dest.origin.y) &&
          ((source.origin.y + source.size.height) <
           (dest.origin.y + dest.size.height));
    // Forward and backward follow the tab order instead, see
    // FocusOrderingHelper::findNextInTabOrder
    case FocusDirection::FocusForward:
    case FocusDirection::FocusBackward:
      return false;
  }
}

bool isBetterCandidate(
    FocusDirection focusDirection,
    Rect source,
    Rect current,
    Rect candidate) {
  if (!isCandidate(source, candidate, focusDirection)) {
    return false;
  }

  double candidateWeightedDistance = 0;
  double currentWeightedDistance = 0;

  switch (focusDirection) {
    case FocusDirection::FocusLeft:
    case FocusDirection::FocusRight:
    case FocusDirection::FocusUp:
    case FocusDirection::FocusDown:
      candidateWeightedDistance = getWeightedDistanceFor(
          majorAxisDistance(focusDirection, source, candidate),
          minorAxisDistance(focusDirection, source, candidate));

      currentWeightedDistance = getWeightedDistanceFor(
          majorAxisDistance(focusDirection, source, current),
          minorAxisDistance(focusDirection, source, current));

      return candidateWeightedDistance < currentWeightedDistance;
    case FocusDirection::FocusForward:
    case FocusDirection::FocusBackward:
      return false;
  }
  return false;
}

bool isKeyboardFocusable(const ShadowNode& shadowNode) {
  const auto* props =
      dynamic_cast<const ViewProps*>(shadowNode.getProps().get());

  return shadowNode.getTraits().check(
             ShadowNodeTraits::Trait::KeyboardFocusable) ||
      (props != nullptr && (props->focusable || props->accessible));
}

struct NativeChild {
  std::shared_ptr<const ShadowNode> shadowNode;
  // In the coordinate space of the native parent
  Rect frame;
  bool hostsItsChildren;
};

// The views a native parent hosts, as the mounting layer flattens them: a
// child that does not form a view is skipped, and the children of one that
// does not form a stacking context are hoisted into the parent.
void appendNativeChildren(
    const ShadowNode& parentShadowNode,
    Point parentOffset,
    std::vector<NativeChild>& nativeChildren) {
  bool childrenFormStackingContexts = parentShadowNode.getTraits().check(
      ShadowNodeTraits::Trait::ChildrenFormStackingContext);

  for (const auto& childShadowNode : parentShadowNode.getChildren()) {
    const auto& traits = childShadowNode->getTraits();
    const auto* layoutableShadowNode =
        dynamic_cast<const LayoutableShadowNode*>(childShadowNode.get());

    if (traits.check(ShadowNodeTraits::Trait::RootNodeKind) ||
        traits.check(ShadowNodeTraits::Trait::Hidden) ||
        layoutableShadowNode == nullptr) {
      continue;
    }

    Rect frame = layoutableShadowNode->getLayoutMetrics().frame;
    frame.origin += parentOffset;

    bool forceFlattenView =
        traits.check(ShadowNodeTraits::Trait::ForceFlattenView);
    bool isConcreteView = (traits.check(ShadowNodeTraits::Trait::FormsView) ||
                           childrenFormStackingContexts) &&
        !forceFlattenView;
    bool areChildrenFlattened =
        (!traits.check(ShadowNodeTraits::Trait::FormsStackingContext) &&
         !childrenFormStackingContexts) ||
        forceFlattenView;

    if (isConcreteView) {
      nativeChildren.push_back(
          {.shadowNode = childShadowNode,
           .frame = frame,
           .hostsItsChildren = !areChildrenFlattened});
    }

    if (areChildrenFlattened) {
      appendNativeChildren(*childShadowNode, frame.origin, nativeChildren);
    }
  }
}

/*
 * Sorts siblings the way Android's FocusFinder.FocusSorter does: top to bottom,
 * then each run of vertically overlapping views forms a row, sorted by its
 * start edge.
 *
 * See:
 * https://cs.android.com/android/platform/superproject/main/+/main:frameworks/base/core/java/android/view/FocusFinder.java;l=833;drc=61197364367c9e404c7da6900658f1b16c42d0da
 */
void sortInTabOrder(std::vector<NativeChild>& nativeChildren, bool isRTL) {
  if (nativeChildren.size() < 2) {
    return;
  }

  auto sortRow = [isRTL](auto rowBegin, auto rowEnd) {
    std::stable_sort(
        rowBegin, rowEnd, [isRTL](const auto& first, const auto& second) {
          if (first.frame.getMinX() != second.frame.getMinX()) {
            return isRTL ? first.frame.getMinX() > second.frame.getMinX()
                         : first.frame.getMinX() < second.frame.getMinX();
          }
          return first.frame.getMaxX() < second.frame.getMaxX();
        });
  };

  std::stable_sort(
      nativeChildren.begin(),
      nativeChildren.end(),
      [](const auto& first, const auto& second) {
        if (first.frame.getMinY() != second.frame.getMinY()) {
          return first.frame.getMinY() < second.frame.getMinY();
        }
        return first.frame.getMaxY() < second.frame.getMaxY();
      });

  auto rowBegin = nativeChildren.begin();
  Float sweepBottom = rowBegin->frame.getMaxY();
  for (auto it = std::next(nativeChildren.begin()); it != nativeChildren.end();
       ++it) {
    if (it->frame.getMinY() >= sweepBottom) {
      sortRow(rowBegin, it);
      rowBegin = it;
      sweepBottom = it->frame.getMaxY();
    } else {
      sweepBottom = std::max(sweepBottom, it->frame.getMaxY());
    }
  }
  sortRow(rowBegin, nativeChildren.end());
}

bool isLayoutRTL(const ShadowNode& shadowNode) {
  const auto* layoutableShadowNode =
      dynamic_cast<const LayoutableShadowNode*>(&shadowNode);
  return layoutableShadowNode != nullptr &&
      layoutableShadowNode->getLayoutMetrics().layoutDirection ==
      LayoutDirection::RightToLeft;
}

void appendFocusablesInTabOrder(
    const ShadowNode& parentShadowNode,
    std::vector<std::shared_ptr<const ShadowNode>>& focusables) {
  std::vector<NativeChild> nativeChildren;
  appendNativeChildren(parentShadowNode, Point{}, nativeChildren);
  sortInTabOrder(nativeChildren, isLayoutRTL(parentShadowNode));

  for (const auto& nativeChild : nativeChildren) {
    if (isKeyboardFocusable(*nativeChild.shadowNode)) {
      focusables.push_back(nativeChild.shadowNode);
    }
    if (nativeChild.hostsItsChildren) {
      appendFocusablesInTabOrder(*nativeChild.shadowNode, focusables);
    }
  }
}

void FocusOrderingHelper::traverseAndUpdateNextFocusableElement(
    const std::shared_ptr<const ShadowNode>& parentShadowNode,
    const std::shared_ptr<const ShadowNode>& focusedShadowNode,
    const std::shared_ptr<const ShadowNode>& currNode,
    FocusDirection focusDirection,
    const UIManager& uimanager,
    Rect sourceRect,
    std::optional<Rect>& nextRect,
    std::shared_ptr<const ShadowNode>& nextNode) {
  // We only care about focusable elements since only they can be both
  // focused and present in the hierarchy
  if (isKeyboardFocusable(*currNode)) {
    LayoutMetrics nodeLayoutMetrics = uimanager.getRelativeLayoutMetrics(
        *currNode, parentShadowNode.get(), {.includeTransform = true});

    if (nextRect == std::nullopt &&
        isCandidate(sourceRect, nodeLayoutMetrics.frame, focusDirection)) {
      nextNode = currNode;
      nextRect = nodeLayoutMetrics.frame;
    } else if (
        nextRect != std::nullopt &&
        isBetterCandidate(
            focusDirection,
            sourceRect,
            nextRect.value(),
            nodeLayoutMetrics.frame)) {
      nextNode = currNode;
      nextRect = nodeLayoutMetrics.frame;
    }
  }

  for (auto& child : currNode->getChildren()) {
    if (child->getTraits().check(ShadowNodeTraits::Trait::RootNodeKind)) {
      continue;
    }

    traverseAndUpdateNextFocusableElement(
        parentShadowNode,
        focusedShadowNode,
        child,
        focusDirection,
        uimanager,
        sourceRect,
        nextRect,
        nextNode);
  };
};

std::vector<std::shared_ptr<const ShadowNode>>
FocusOrderingHelper::collectFocusablesInTabOrder(
    const ShadowNode& rootShadowNode) {
  std::vector<std::shared_ptr<const ShadowNode>> focusables;
  appendFocusablesInTabOrder(rootShadowNode, focusables);
  return focusables;
}

std::shared_ptr<const ShadowNode> FocusOrderingHelper::findNextInTabOrder(
    const ShadowNode& rootShadowNode,
    Tag focusedTag,
    FocusDirection focusDirection) {
  auto focusables = collectFocusablesInTabOrder(rootShadowNode);
  auto focused = std::find_if(
      focusables.begin(), focusables.end(), [focusedTag](const auto& node) {
        return node->getTag() == focusedTag;
      });

  if (focused == focusables.end()) {
    return nullptr;
  }

  switch (focusDirection) {
    case FocusDirection::FocusForward:
      return std::next(focused) == focusables.end() ? nullptr
                                                    : *std::next(focused);
    case FocusDirection::FocusBackward:
      return focused == focusables.begin() ? nullptr : *std::prev(focused);
    case FocusDirection::FocusDown:
    case FocusDirection::FocusUp:
    case FocusDirection::FocusRight:
    case FocusDirection::FocusLeft:
      return nullptr;
  }

  return nullptr;
}

std::shared_ptr<const ShadowNode>
FocusOrderingHelper::findShadowNodeByTagRecursively(
    const std::shared_ptr<const ShadowNode>& parentShadowNode,
    Tag tag) {
  if (parentShadowNode->getTag() == tag) {
    return parentShadowNode;
  }

  for (auto& shadowNode : parentShadowNode->getChildren()) {
    if (auto result = findShadowNodeByTagRecursively(shadowNode, tag)) {
      return result;
    }
  }

  return nullptr;
}

std::optional<FocusDirection> FocusOrderingHelper::resolveFocusDirection(
    int direction) {
  switch (static_cast<FocusDirection>(direction)) {
    case FocusDirection::FocusDown:
    case FocusDirection::FocusUp:
    case FocusDirection::FocusRight:
    case FocusDirection::FocusLeft:
    case FocusDirection::FocusForward:
    case FocusDirection::FocusBackward:
      return static_cast<FocusDirection>(direction);
  }

  return std::nullopt;
}
} // namespace facebook::react
