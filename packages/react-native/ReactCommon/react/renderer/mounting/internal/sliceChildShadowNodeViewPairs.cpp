/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "sliceChildShadowNodeViewPairs.h"
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/core/LayoutableShadowNode.h>

#include "ShadowViewNodePair.h"

namespace facebook::react {

namespace {

/*
 * Sorting comparator for `reorderInPlaceIfNeeded`.
 */
bool shouldFirstPairComesBeforeSecondOne(
    const ShadowViewNodePair* lhs,
    const ShadowViewNodePair* rhs) noexcept {
  return lhs->shadowNode->getOrderIndex() < rhs->shadowNode->getOrderIndex();
}

/*
 * Reorders pairs in-place based on `orderIndex` using a stable sort algorithm.
 */
void reorderInPlaceIfNeeded(std::vector<ShadowViewNodePair*>& pairs) noexcept {
  if (pairs.size() < 2) {
    return;
  }

  auto isReorderNeeded = false;
  for (const auto& pair : pairs) {
    if (pair->shadowNode->getOrderIndex() != 0) {
      isReorderNeeded = true;
      break;
    }
  }

  if (!isReorderNeeded) {
    return;
  }

  std::stable_sort(
      pairs.begin(), pairs.end(), &shouldFirstPairComesBeforeSecondOne);
}

/*
 * Whether the slicer leaves out `shadowNode` and its descendants.
 */
bool isHiddenWhenSlicing(const ShadowNode& shadowNode) {
  // T153547836: Disabled on Android because the mounting infrastructure
  // is not fully ready yet.
  return
#ifdef ANDROID
      ReactNativeFeatureFlags::useTraitHiddenOnAndroid() &&
#endif
      shadowNode.getTraits().check(ShadowNodeTraits::Trait::Hidden);
}

/*
 * A child of `parentShadowNode` as the slicer represents it: its view, moved
 * by the offset of the flattened views it was hoisted out of, the origin its
 * own flattened children are offset by, and whether it forms a view and
 * flattens its children.
 */
struct ChildSlice {
  ShadowView shadowView;
  Point origin;
  bool isConcreteView;
  bool areChildrenFlattened;
};

ChildSlice sliceChild(
    const ShadowNode& parentShadowNode,
    const ShadowNode& childShadowNode,
    ShadowView shadowView,
    Point layoutOffset) {
  auto origin = layoutOffset;
  if (shadowView.layoutMetrics != EmptyLayoutMetrics) {
    origin += shadowView.layoutMetrics.frame.origin;
    shadowView.layoutMetrics.frame.origin += layoutOffset;
  }

  // This might not be a FormsView, or a FormsStackingContext. We let the
  // differ handle removal of flattened views from the Mounting layer and
  // shuffling their children around.
  bool childrenFormStackingContexts = parentShadowNode.getTraits().check(
      ShadowNodeTraits::Trait::ChildrenFormStackingContext);
  bool isConcreteView =
      (childShadowNode.getTraits().check(ShadowNodeTraits::Trait::FormsView) ||
       childrenFormStackingContexts) &&
      !childShadowNode.getTraits().check(
          ShadowNodeTraits::Trait::ForceFlattenView);
  bool areChildrenFlattened =
      (!childShadowNode.getTraits().check(
           ShadowNodeTraits::Trait::FormsStackingContext) &&
       !childrenFormStackingContexts) ||
      childShadowNode.getTraits().check(
          ShadowNodeTraits::Trait::ForceFlattenView);

  return {
      .shadowView = std::move(shadowView),
      .origin = origin,
      .isConcreteView = isConcreteView,
      .areChildrenFlattened = areChildrenFlattened};
}

/*
 * Adds `childSlice` to `scope` and its pair to `pairList`: statically
 * positioned pairs go before absolutely positioned ones.
 */
void addChildSlice(
    std::vector<ShadowViewNodePair*>& pairList,
    size_t& startOfStaticIndex,
    ViewNodePairScope& scope,
    const ChildSlice& childSlice,
    const ShadowNode& childShadowNode) {
  scope.push_back(
      {childSlice.shadowView,
       &childShadowNode,
       childSlice.areChildrenFlattened,
       childSlice.isConcreteView,
       childSlice.areChildrenFlattened ? childSlice.origin : Point{}});

  if (childSlice.shadowView.layoutMetrics.positionType ==
      PositionType::Static) {
    auto it = pairList.begin();
    std::advance(it, startOfStaticIndex);
    pairList.insert(it, &scope.back());
    startOfStaticIndex++;
  } else {
    pairList.push_back(&scope.back());
  }
}

void sliceChildShadowNodeViewPairsRecursively(
    std::vector<ShadowViewNodePair*>& pairList,
    size_t& startOfStaticIndex,
    ViewNodePairScope& scope,
    Point layoutOffset,
    const ShadowNode& shadowNode,
    const CullingContext& cullingContext) {
  for (const auto& sharedChildShadowNode : shadowNode.getChildren()) {
    auto& childShadowNode = *sharedChildShadowNode;
    if (isHiddenWhenSlicing(childShadowNode)) {
      continue;
    }
    auto shadowView = ShadowView(childShadowNode);

    if (ReactNativeFeatureFlags::enableViewCulling()) {
      auto isViewCullable =
          !shadowView.traits.check(
              ShadowNodeTraits::Trait::Unstable_uncullableView) &&
          !shadowView.traits.check(
              ShadowNodeTraits::Trait::Unstable_uncullableTrace);
      if (cullingContext.shouldConsiderCulling() && isViewCullable) {
        auto overflowInsetFrame =
            shadowView.layoutMetrics.getOverflowInsetFrame() *
            cullingContext.transform;
        if (auto layoutableShadowNode =
                dynamic_cast<const LayoutableShadowNode*>(&childShadowNode)) {
          overflowInsetFrame =
              overflowInsetFrame * layoutableShadowNode->getTransform();
        }

        // Embedded Text components can have an empty layout, while these still
        // need to be mounted to set the correct react tags on the text
        // fragments. These should not be culled.
        auto hasLayout = overflowInsetFrame.size.width > 0 ||
            overflowInsetFrame.size.height > 0;

        auto doesIntersect =
            Rect::intersect(cullingContext.frame, overflowInsetFrame) != Rect{};
        if (hasLayout && !doesIntersect) {
          continue; // Culling.
        }
      }
    }

    auto cullingContextCopy = cullingContext.adjustCullingContextIfNeeded(
        {.shadowView = shadowView, .shadowNode = &childShadowNode});

    auto childSlice = sliceChild(
        shadowNode, childShadowNode, std::move(shadowView), layoutOffset);
    addChildSlice(
        pairList, startOfStaticIndex, scope, childSlice, childShadowNode);

    if (!childSlice.areChildrenFlattened) {
      continue;
    }
    if (childSlice.shadowView.layoutMetrics.positionType ==
        PositionType::Static) {
      sliceChildShadowNodeViewPairsRecursively(
          pairList,
          startOfStaticIndex,
          scope,
          childSlice.origin,
          childShadowNode,
          cullingContextCopy);
    } else {
      size_t pairListSize = pairList.size();
      sliceChildShadowNodeViewPairsRecursively(
          pairList,
          pairListSize,
          scope,
          childSlice.origin,
          childShadowNode,
          cullingContextCopy);
    }
  }
}

/*
 * Sets the mount index of each pair after reordering.
 */
void assignMountIndexes(std::vector<ShadowViewNodePair*>& pairList) {
  size_t mountIndex = 0;
  for (auto child : pairList) {
    child->mountIndex =
        (child->isConcreteView ? mountIndex++ : static_cast<unsigned long>(-1));
  }
}

bool sliceChangedChildShadowNodeViewPairsRecursively(
    std::vector<ShadowViewNodePair*>& oldPairList,
    size_t& oldStartOfStaticIndex,
    std::vector<ShadowViewNodePair*>& newPairList,
    size_t& newStartOfStaticIndex,
    ViewNodePairScope& scope,
    Point oldLayoutOffset,
    Point newLayoutOffset,
    const ShadowNode& oldShadowNode,
    const ShadowNode& newShadowNode) {
  const auto& oldChildren = oldShadowNode.getChildren();
  const auto& newChildren = newShadowNode.getChildren();
  if (oldChildren.size() != newChildren.size() ||
      oldShadowNode.getTraits().check(
          ShadowNodeTraits::Trait::ChildrenFormStackingContext) !=
          newShadowNode.getTraits().check(
              ShadowNodeTraits::Trait::ChildrenFormStackingContext)) {
    return false;
  }

  bool isSameLayoutOffset = oldLayoutOffset == newLayoutOffset;
  for (size_t i = 0; i < oldChildren.size(); i++) {
    const auto& oldChildShadowNode = *oldChildren[i];
    const auto& newChildShadowNode = *newChildren[i];

    bool isHidden = isHiddenWhenSlicing(oldChildShadowNode);
    if (isHidden != isHiddenWhenSlicing(newChildShadowNode)) {
      return false;
    }
    if (isHidden) {
      continue;
    }

    // The same node at the same offset gives the same pairs in both lists,
    // which the differ matches without a mutation.
    if (&oldChildShadowNode == &newChildShadowNode && isSameLayoutOffset) {
      continue;
    }

    if (oldChildShadowNode.getTag() != newChildShadowNode.getTag() ||
        oldChildShadowNode.getOrderIndex() !=
            newChildShadowNode.getOrderIndex()) {
      return false;
    }

    auto oldChildSlice = sliceChild(
        oldShadowNode,
        oldChildShadowNode,
        ShadowView(oldChildShadowNode),
        oldLayoutOffset);
    auto newChildSlice = sliceChild(
        newShadowNode,
        newChildShadowNode,
        ShadowView(newChildShadowNode),
        newLayoutOffset);
    bool isStatic = newChildSlice.shadowView.layoutMetrics.positionType ==
        PositionType::Static;
    if (oldChildSlice.isConcreteView != newChildSlice.isConcreteView ||
        oldChildSlice.areChildrenFlattened !=
            newChildSlice.areChildrenFlattened ||
        (oldChildSlice.shadowView.layoutMetrics.positionType ==
         PositionType::Static) != isStatic) {
      return false;
    }

    addChildSlice(
        oldPairList,
        oldStartOfStaticIndex,
        scope,
        oldChildSlice,
        oldChildShadowNode);
    addChildSlice(
        newPairList,
        newStartOfStaticIndex,
        scope,
        newChildSlice,
        newChildShadowNode);

    if (!newChildSlice.areChildrenFlattened) {
      continue;
    }
    if (isStatic) {
      if (!sliceChangedChildShadowNodeViewPairsRecursively(
              oldPairList,
              oldStartOfStaticIndex,
              newPairList,
              newStartOfStaticIndex,
              scope,
              oldChildSlice.origin,
              newChildSlice.origin,
              oldChildShadowNode,
              newChildShadowNode)) {
        return false;
      }
    } else {
      size_t oldPairListSize = oldPairList.size();
      size_t newPairListSize = newPairList.size();
      if (!sliceChangedChildShadowNodeViewPairsRecursively(
              oldPairList,
              oldPairListSize,
              newPairList,
              newPairListSize,
              scope,
              oldChildSlice.origin,
              newChildSlice.origin,
              oldChildShadowNode,
              newChildShadowNode)) {
        return false;
      }
    }
  }
  return true;
}

} // namespace

bool sliceChangedChildShadowNodeViewPairs(
    const ShadowViewNodePair& oldShadowNodePair,
    const ShadowViewNodePair& newShadowNodePair,
    ViewNodePairScope& scope,
    bool allowFlattened,
    std::vector<ShadowViewNodePair*>& oldPairList,
    std::vector<ShadowViewNodePair*>& newPairList) {
  if (ReactNativeFeatureFlags::enableViewCulling()) {
    return false;
  }

  oldPairList.clear();
  newPairList.clear();
  bool isOldPairSkipped = oldShadowNodePair.flattened &&
      oldShadowNodePair.isConcreteView && !allowFlattened;
  bool isNewPairSkipped = newShadowNodePair.flattened &&
      newShadowNodePair.isConcreteView && !allowFlattened;
  if (isOldPairSkipped != isNewPairSkipped) {
    return false;
  }
  if (isOldPairSkipped) {
    return true;
  }

  size_t oldStartOfStaticIndex = 0;
  size_t newStartOfStaticIndex = 0;
  if (!sliceChangedChildShadowNodeViewPairsRecursively(
          oldPairList,
          oldStartOfStaticIndex,
          newPairList,
          newStartOfStaticIndex,
          scope,
          oldShadowNodePair.contextOrigin,
          newShadowNodePair.contextOrigin,
          *oldShadowNodePair.shadowNode,
          *newShadowNodePair.shadowNode)) {
    return false;
  }

  reorderInPlaceIfNeeded(oldPairList);
  reorderInPlaceIfNeeded(newPairList);
  assignMountIndexes(oldPairList);
  assignMountIndexes(newPairList);
  return true;
}

std::vector<ShadowViewNodePair*> sliceChildShadowNodeViewPairs(
    const ShadowViewNodePair& shadowNodePair,
    ViewNodePairScope& scope,
    bool allowFlattened,
    Point layoutOffset,
    const CullingContext& cullingContext) {
  const auto& shadowNode = *shadowNodePair.shadowNode;
  auto pairList = std::vector<ShadowViewNodePair*>{};

  if (shadowNodePair.flattened && shadowNodePair.isConcreteView &&
      !allowFlattened) {
    return pairList;
  }

  size_t startOfStaticIndex = 0;

  sliceChildShadowNodeViewPairsRecursively(
      pairList,
      startOfStaticIndex,
      scope,
      layoutOffset,
      shadowNode,
      cullingContext);

  // Sorting pairs based on `orderIndex` if needed.
  reorderInPlaceIfNeeded(pairList);

  assignMountIndexes(pairList);

  return pairList;
}

} // namespace facebook::react
