/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FocusOrderingHelper.h"
#include <react/renderer/uimanager/UIManager.h>

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
    case FocusDirection::FocusForward:
      return ((source.origin.y < dest.origin.y ||
               (source.origin.y + source.size.height) <= dest.origin.y) &&
              ((source.origin.y + source.size.height) <
               (dest.origin.y + dest.size.height))) ||
          ((source.origin.x < dest.origin.x ||
            (source.origin.x + source.size.width) <= dest.origin.x) &&
           (source.origin.x + source.size.width) <
               (dest.origin.x + dest.size.width));
    case FocusDirection::FocusBackward:
      return (((source.origin.y + source.size.height) >
                   (dest.origin.y + dest.size.height) ||
               source.origin.y >= (dest.origin.y + dest.size.height)) &&
              source.origin.y > dest.origin.y) ||
          (((source.origin.x + source.size.width) >
                (dest.origin.x + dest.size.width) ||
            source.origin.x >= (dest.origin.x + dest.size.width)) &&
           source.origin.x > dest.origin.x);
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
    /*
     * For forward and backward, Android uses a different algorithm to tell the
     * order in which to focus. It sorts the children of the root by top to
     * bottom and then groups the views into "rows". Then, it looks for the
     * index of the current focused, and focuses the next or previous element.
     *
     * We are not implementing this algorithm, but instead, we are using the
     * same comparison logic android uses to sort the children to find the next
     * focusable.
     *
     * See:
     * https://cs.android.com/android/platform/superproject/main/+/main:frameworks/base/core/java/android/view/FocusFinder.java;l=833;drc=61197364367c9e404c7da6900658f1b16c42d0da
     */
    case FocusDirection::FocusForward: {
      Float currentRowBottom = source.origin.y + source.size.height;
      Float candidateRowBottom = candidate.origin.y + candidate.size.height;
      Float result = NAN;

      if (candidate.origin.y < currentRowBottom &&
          candidateRowBottom > source.origin.y) {
        result = candidate.origin.x - current.origin.x;
        if (result == 0.0) {
          result = (candidate.origin.x + candidate.size.width) -
              (current.origin.x + current.size.width);
        }
        return result < 0.0;
      } else {
        result = candidate.origin.y - current.origin.y;
        if (result == 0.0) {
          result = (candidate.origin.y + candidate.size.height) -
              (current.origin.y + current.size.height);
        }
        return result < 0.0;
      }
    }
    case FocusDirection::FocusBackward: {
      Float currentRowBottom = source.origin.y + source.size.height;
      Float candidateRowBottom = candidate.origin.y + candidate.size.height;
      Float result = NAN;

      if (candidate.origin.y < currentRowBottom &&
          candidateRowBottom > source.origin.y) {
        result = current.origin.x - candidate.origin.x;
        if (result == 0.0) {
          result = (current.origin.x + current.size.width) -
              (candidate.origin.x + candidate.size.width);
        }
        return result < 0.0;
      } else {
        result = current.origin.y - candidate.origin.y;
        if (result == 0.0) {
          result = (current.origin.y + current.size.height) -
              (candidate.origin.y + candidate.size.height);
        }
        return result < 0.0;
      }
    }
  }
  return false;
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
  const auto* props =
      dynamic_cast<const ViewProps*>(currNode->getProps().get());

  // We only care about focusable elements since only they can be both
  // focused and present in the hierarchy
  if (currNode->getTraits().check(ShadowNodeTraits::Trait::KeyboardFocusable) ||
      (props != nullptr &&
       (props->focusable || props->accessible || props->hasTVPreferredFocus))) {
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
