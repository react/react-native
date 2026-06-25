/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Differentiator.h"

#include <cxxreact/TraceSection.h>
#include <react/debug/react_native_assert.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <algorithm>
#include <unordered_map>
#include "internal/CullingContext.h"
#include "internal/ShadowViewNodePair.h"
#include "internal/sliceChildShadowNodeViewPairs.h"

#include "ShadowView.h"

#ifdef DEBUG_LOGS_DIFFER
#include <glog/logging.h>
#define DEBUG_LOGS(code) code
#else
#define DEBUG_LOGS(code)
#endif

namespace facebook::react {

enum class ReparentMode { Flatten, Unflatten };

#ifdef DEBUG_LOGS_DIFFER
static std::ostream& operator<<(
    std::ostream& out,
    const ShadowViewNodePair& pair) {
  out << pair.shadowView.tag;
  if (!pair.isConcreteView) {
    out << '\'';
  }
  if (pair.flattened) {
    out << '*';
  }
  return out;
}

static std::ostream& operator<<(
    std::ostream& out,
    std::vector<ShadowViewNodePair*> vec) {
  for (int i = 0; i < vec.size(); i++) {
    if (i > 0) {
      out << ", ";
    }
    out << *vec[i];
  }
  return out;
}
#endif

#ifdef DEBUG_LOGS_DIFFER
template <typename KeyT, typename ValueT>
static std::ostream& operator<<(
    std::ostream& out,
    const std::unordered_map<KeyT, ValueT>& map) {
  auto it = map.begin();
  if (it != map.end()) {
    out << *it->second;
    ++it;
  }
  for (; it != map.end(); ++it) {
    out << ", " << *it->second;
  }
  return out;
}
#endif

/**
 * Prefer calling this over `sliceChildShadowNodeViewPairs` directly, when
 * possible. This can account for adding parent LayoutMetrics that are
 * important to take into account, but tricky, in (un)flattening cases.
 */
static std::vector<ShadowViewNodePair*>
sliceChildShadowNodeViewPairsFromViewNodePair(
    const ShadowViewNodePair& shadowViewNodePair,
    ViewNodePairScope& scope,
    bool allowFlattened,
    const CullingContext& cullingContext) {
  return sliceChildShadowNodeViewPairs(
      shadowViewNodePair,
      scope,
      allowFlattened,
      shadowViewNodePair.contextOrigin,
      cullingContext);
}

/*
 * Before we start to diff, let's make sure all our core data structures are
 * in good shape to deliver the best performance.
 */
static_assert(
    std::is_move_constructible<ShadowViewMutation>::value,
    "`ShadowViewMutation` must be `move constructible`.");
static_assert(
    std::is_move_constructible<ShadowView>::value,
    "`ShadowView` must be `move constructible`.");
static_assert(
    std::is_move_constructible<ShadowViewNodePair>::value,
    "`ShadowViewNodePair` must be `move constructible`.");
static_assert(
    std::is_move_constructible<std::vector<ShadowViewNodePair*>>::value,
    "`std::vector<ShadowViewNodePair*>` must be `move constructible`.");

static_assert(
    std::is_move_assignable<ShadowViewMutation>::value,
    "`ShadowViewMutation` must be `move assignable`.");
static_assert(
    std::is_move_assignable<ShadowView>::value,
    "`ShadowView` must be `move assignable`.");
static_assert(
    std::is_move_assignable<ShadowViewNodePair>::value,
    "`ShadowViewNodePair` must be `move assignable`.");

static void calculateShadowViewMutations(
    ViewNodePairScope& scope,
    ShadowViewMutation::List& mutations,
    Tag parentTag,
    std::vector<ShadowViewNodePair*>&& oldChildPairs,
    std::vector<ShadowViewNodePair*>&& newChildPairs,
    const CullingContext& oldCullingContext = {},
    const CullingContext& newCullingContext = {});

namespace {

struct OrderedMutationInstructionContainer {
  ShadowViewMutation::List createMutations{};
  ShadowViewMutation::List deleteMutations{};
  ShadowViewMutation::List insertMutations{};
  ShadowViewMutation::List removeMutations{};
  ShadowViewMutation::List updateMutations{};
  ShadowViewMutation::List downwardMutations{};
  ShadowViewMutation::List destructiveDownwardMutations{};
};

} // namespace

static void updateMatchedPairSubtrees(
    ViewNodePairScope& scope,
    OrderedMutationInstructionContainer& mutationContainer,
    std::unordered_map<Tag, ShadowViewNodePair*>& newRemainingPairs,
    std::vector<ShadowViewNodePair*>& oldChildPairs,
    Tag parentTag,
    const ShadowViewNodePair& oldPair,
    const ShadowViewNodePair& newPair,
    const CullingContext& oldCullingContext,
    const CullingContext& newCullingContext);

static void updateMatchedPair(
    OrderedMutationInstructionContainer& mutationContainer,
    bool oldNodeFoundInOrder,
    bool newNodeFoundInOrder,
    Tag parentTag,
    const ShadowViewNodePair& oldPair,
    const ShadowViewNodePair& newPair);

static void calculateShadowViewMutationsFlattener(
    ViewNodePairScope& scope,
    ReparentMode reparentMode,
    OrderedMutationInstructionContainer& mutationContainer,
    Tag parentTag,
    std::unordered_map<Tag, ShadowViewNodePair*>& unvisitedOtherNodes,
    const ShadowViewNodePair& node,
    Tag parentTagForUpdate,
    std::unordered_map<Tag, ShadowViewNodePair*>* parentSubVisitedOtherNewNodes,
    std::unordered_map<Tag, ShadowViewNodePair*>* parentSubVisitedOtherOldNodes,
    const CullingContext& cullingContextForUnvisitedOtherNodes,
    const CullingContext& cullingContext);

/**
 * Updates the subtrees of any matched ShadowViewNodePair. This handles
 * all cases of flattening/unflattening.
 *
 * This may modify data-structures passed to it and owned by the caller,
 * specifically `newRemainingPairs`, and so the caller must also own
 * the ViewNodePairScope used within.
 */
static void updateMatchedPairSubtrees(
    ViewNodePairScope& scope,
    OrderedMutationInstructionContainer& mutationContainer,
    std::unordered_map<Tag, ShadowViewNodePair*>& newRemainingPairs,
    std::vector<ShadowViewNodePair*>& oldChildPairs,
    Tag parentTag,
    const ShadowViewNodePair& oldPair,
    const ShadowViewNodePair& newPair,
    const CullingContext& oldCullingContext,
    const CullingContext& newCullingContext) {
  // Are we flattening or unflattening either one? If node was
  // flattened in both trees, there's no change, just continue.
  if (oldPair.flattened && newPair.flattened) {
    return;
  }

  // We are either flattening or unflattening this node.
  if (oldPair.flattened != newPair.flattened) {
    DEBUG_LOGS({
      LOG(ERROR) << "Differ: "
                 << (newPair.flattened ? "flattening" : "unflattening")
                 << " in updateMatchedPairSubtrees: " << oldPair << " and "
                 << newPair << " with parent [" << parentTag << "]";
    });

    auto oldCullingContextCopy =
        oldCullingContext.adjustCullingContextIfNeeded(oldPair);
    auto newCullingContextCopy =
        newCullingContext.adjustCullingContextIfNeeded(newPair);

    // Flattening
    if (!oldPair.flattened) {
      // Flatten old tree into new list
      // At the end of this loop we still want to know which of these
      // children are visited, so we reuse the `newRemainingPairs`
      // map.
      calculateShadowViewMutationsFlattener(
          scope,
          ReparentMode::Flatten,
          mutationContainer,
          parentTag,
          newRemainingPairs,
          oldPair,
          oldPair.shadowView.tag,
          nullptr,
          nullptr,
          oldCullingContext,
          oldCullingContextCopy);
    }
    // Unflattening
    else {
      // Construct unvisited nodes map
      // We don't know where all the children of oldChildPair are
      // within oldChildPairs, but we know that they're in the same
      // relative order. The reason for this is because of flattening
      // + zIndex: the children could be listed before the parent,
      // interwoven with children from other nodes, etc.
      auto oldFlattenedNodes = sliceChildShadowNodeViewPairsFromViewNodePair(
          oldPair, scope, true, oldCullingContextCopy);
      std::unordered_map<Tag, ShadowViewNodePair*> unvisitedOldChildPairs;
      unvisitedOldChildPairs.reserve(oldFlattenedNodes.size());
      for (size_t i = 0, j = 0;
           i < oldChildPairs.size() && j < oldFlattenedNodes.size();
           i++) {
        auto& oldChild = *oldChildPairs[i];
        if (oldChild.shadowView.tag == oldFlattenedNodes[j]->shadowView.tag) {
          unvisitedOldChildPairs.insert({oldChild.shadowView.tag, &oldChild});
          j++;
        }
      }

      // Unflatten old list into new tree
      calculateShadowViewMutationsFlattener(
          scope,
          ReparentMode::Unflatten,
          mutationContainer,
          parentTag,
          unvisitedOldChildPairs,
          newPair,
          parentTag,
          nullptr,
          nullptr,
          newCullingContext,
          newCullingContextCopy);

      // If old nodes were not visited, we know that we can delete
      // them now. They will be removed from the hierarchy by the
      // outermost loop of this function.
      // TODO: is this necessary anymore?
      for (auto& oldFlattenedNodePtr : oldFlattenedNodes) {
        auto& oldFlattenedNode = *oldFlattenedNodePtr;
        auto unvisitedOldChildPairIt =
            unvisitedOldChildPairs.find(oldFlattenedNode.shadowView.tag);
        if (unvisitedOldChildPairIt == unvisitedOldChildPairs.end()) {
          // Node was visited - make sure to remove it from
          // "newRemainingPairs" map
          auto newRemainingIt =
              newRemainingPairs.find(oldFlattenedNode.shadowView.tag);
          if (newRemainingIt != newRemainingPairs.end()) {
            newRemainingPairs.erase(newRemainingIt);
          }
        }
      }
    }

    return;
  }

  auto oldCullingContextCopy =
      oldCullingContext.adjustCullingContextIfNeeded(oldPair);
  auto newCullingContextCopy =
      newCullingContext.adjustCullingContextIfNeeded(newPair);

  // Update subtrees if View is not flattened, and if node addresses
  // are not equal
  if (oldPair.shadowNode != newPair.shadowNode ||
      oldCullingContextCopy != newCullingContextCopy) {
    ViewNodePairScope innerScope{};
    auto oldGrandChildPairs = sliceChildShadowNodeViewPairsFromViewNodePair(
        oldPair, innerScope, false, oldCullingContextCopy);
    auto newGrandChildPairs = sliceChildShadowNodeViewPairsFromViewNodePair(
        newPair, innerScope, false, newCullingContextCopy);
    const size_t newGrandChildPairsSize = newGrandChildPairs.size();

    calculateShadowViewMutations(
        innerScope,
        *(newGrandChildPairsSize != 0u
              ? &mutationContainer.downwardMutations
              : &mutationContainer.destructiveDownwardMutations),
        oldPair.shadowView.tag,
        std::move(oldGrandChildPairs),
        std::move(newGrandChildPairs),
        oldCullingContextCopy,
        newCullingContextCopy);
  }
}

/**
 * Handle updates to a matched node pair, but NOT to their subtrees.
 *
 * Here we have (and need) knowledge of whether a node was found during
 * in-order traversal, or out-of-order via a map lookup. Nodes are only REMOVEd
 * or INSERTTed when they are encountered via in-order-traversal, to ensure
 * correct ordering of INSERT and REMOVE mutations.
 */
static void updateMatchedPair(
    OrderedMutationInstructionContainer& mutationContainer,
    bool oldNodeFoundInOrder,
    bool newNodeFoundInOrder,
    Tag parentTag,
    const ShadowViewNodePair& oldPair,
    const ShadowViewNodePair& newPair) {
  oldPair.otherTreePair = &newPair;
  newPair.otherTreePair = &oldPair;

  // Check concrete-ness of views
  // Create/Delete and Insert/Remove if necessary
  if (oldPair.isConcreteView != newPair.isConcreteView) {
    if (newPair.isConcreteView) {
      if (newNodeFoundInOrder) {
        mutationContainer.insertMutations.push_back(
            ShadowViewMutation::InsertMutation(
                parentTag,
                newPair.shadowView,
                static_cast<int>(newPair.mountIndex)));
      }
      mutationContainer.createMutations.push_back(
          ShadowViewMutation::CreateMutation(newPair.shadowView));
    } else {
      if (oldNodeFoundInOrder) {
        mutationContainer.removeMutations.push_back(
            ShadowViewMutation::RemoveMutation(
                parentTag,
                oldPair.shadowView,
                static_cast<int>(oldPair.mountIndex)));
      }
      mutationContainer.deleteMutations.push_back(
          ShadowViewMutation::DeleteMutation(oldPair.shadowView));
    }
  } else if (oldPair.isConcreteView && newPair.isConcreteView) {
    // If we found the old node by traversing, but not the new node,
    // it means that there's some reordering requiring a REMOVE mutation.
    if (oldNodeFoundInOrder && !newNodeFoundInOrder) {
      mutationContainer.removeMutations.push_back(
          ShadowViewMutation::RemoveMutation(
              parentTag,
              newPair.shadowView,
              static_cast<int>(oldPair.mountIndex)));
    }

    // Even if node's children are flattened, it might still be a
    // concrete view. The case where they're different is handled
    // above.
    if (oldPair.shadowView != newPair.shadowView) {
      mutationContainer.updateMutations.push_back(
          ShadowViewMutation::UpdateMutation(
              oldPair.shadowView, newPair.shadowView, parentTag));
    }
  }
}

/**
 * Here we flatten or unflatten a subtree, given an unflattened node in either
 * the old or new tree, and a list of flattened nodes in the other tree.
 *
 * For example: if you are Flattening, the node will be in the old tree and
 * the list will be from the new tree. If you are Unflattening, the opposite is
 * true.
 *
 * It is currently not possible for ReactJS, and therefore React Native, to
 * move a node *from* one parent to another without an entirely new subtree
 * being created. When we "reparent" in React Native here it is only because
 * intermediate ShadowNodes/ShadowViews, which *always* exist, are flattened or
 * unflattened away.
 *
 * Thus, this algorithm handles the very specialized cases of the tree
 * collapsing or expanding vertically in that way.

 * Sketch of algorithm:
 * 0. Create a map of nodes in the flattened list. This should be done
 *    before calling this function.
 * 1. Traverse the Node Subtree; remove elements from the map as they are
 *    visited in the tree.
 *    Perform a Remove/Insert depending on if we're flattening or unflattening
 *    If Tree node is not in Map/List, perform Delete/Create.
 * 2. Traverse the list.
 *    Perform linear remove from the old View, or insert into the new parent
 *    View if we're flattening.
 *    If a node is in the list but not the map, it means it's been visited and
 *    Update has already been
 *    performed in the subtree. If it *is* in the map, it means the node is not
 *    in the Tree, and should be Deleted/Created  **after this function is
 *    called**, by the caller.
 *
 * @param parentTag parent under which nodes should be mounted/unmounted
 * @param parentTagForUpdate current parent in which node is mounted,
 *    used for update mutations
 */
static void calculateShadowViewMutationsFlattener(
    ViewNodePairScope& scope,
    ReparentMode reparentMode,
    OrderedMutationInstructionContainer& mutationContainer,
    Tag parentTag,
    std::unordered_map<Tag, ShadowViewNodePair*>& unvisitedOtherNodes,
    const ShadowViewNodePair& node,
    Tag parentTagForUpdate,
    std::unordered_map<Tag, ShadowViewNodePair*>* parentSubVisitedOtherNewNodes,
    std::unordered_map<Tag, ShadowViewNodePair*>* parentSubVisitedOtherOldNodes,
    const CullingContext& cullingContextForUnvisitedOtherNodes,
    const CullingContext& cullingContext) {
  // Step 1: iterate through entire tree
  std::vector<ShadowViewNodePair*> treeChildren =
      sliceChildShadowNodeViewPairsFromViewNodePair(
          node, scope, false, cullingContext);

  DEBUG_LOGS({
    LOG(ERROR) << "Differ Flattener: "
               << (reparentMode == ReparentMode::Unflatten ? "Unflattening"
                                                           : "Flattening")
               << " [" << node.shadowView.tag << "]";
    LOG(ERROR) << "> Tree Child Pairs: " << treeChildren;
    LOG(ERROR) << "> List Child Pairs: " << unvisitedOtherNodes;
  });

  // Views in other tree that are visited by sub-flattening or
  // sub-unflattening
  std::unordered_map<Tag, ShadowViewNodePair*> subVisitedOtherNewNodes{};
  std::unordered_map<Tag, ShadowViewNodePair*> subVisitedOtherOldNodes{};
  auto subVisitedNewMap =
      (parentSubVisitedOtherNewNodes != nullptr ? parentSubVisitedOtherNewNodes
                                                : &subVisitedOtherNewNodes);
  auto subVisitedOldMap =
      (parentSubVisitedOtherOldNodes != nullptr ? parentSubVisitedOtherOldNodes
                                                : &subVisitedOtherOldNodes);

  // Candidates for full tree creation or deletion at the end of this function
  std::unordered_map<Tag, const ShadowViewNodePair*>
      deletionCreationCandidatePairs;
  deletionCreationCandidatePairs.reserve(treeChildren.size());

  for (size_t index = 0;
       index < treeChildren.size() && index < treeChildren.size();
       index++) {
    auto& treeChildPair = *treeChildren[index];

    // Try to find node in other tree
    auto unvisitedIt = unvisitedOtherNodes.find(treeChildPair.shadowView.tag);
    auto subVisitedOtherNewIt =
        (unvisitedIt == unvisitedOtherNodes.end()
             ? subVisitedNewMap->find(treeChildPair.shadowView.tag)
             : subVisitedNewMap->end());
    auto subVisitedOtherOldIt =
        (unvisitedIt == unvisitedOtherNodes.end() &&
                 subVisitedOtherNewIt == subVisitedNewMap->end()
             ? subVisitedOldMap->find(treeChildPair.shadowView.tag)
             : subVisitedOldMap->end());

    bool existsInOtherTree = unvisitedIt != unvisitedOtherNodes.end() ||
        subVisitedOtherNewIt != subVisitedNewMap->end() ||
        subVisitedOtherOldIt != subVisitedOldMap->end();

    auto otherTreeNodePairPtr =
        (existsInOtherTree
             ? (unvisitedIt != unvisitedOtherNodes.end()
                    ? unvisitedIt->second
                    : (subVisitedOtherNewIt != subVisitedNewMap->end()
                           ? subVisitedOtherNewIt->second
                           : subVisitedOtherOldIt->second))
             : nullptr);

    react_native_assert(
        !existsInOtherTree ||
        (unvisitedIt != unvisitedOtherNodes.end() ||
         subVisitedOtherNewIt != subVisitedNewMap->end() ||
         subVisitedOtherOldIt != subVisitedOldMap->end()));
    react_native_assert(
        unvisitedIt == unvisitedOtherNodes.end() ||
        unvisitedIt->second->shadowView.tag == treeChildPair.shadowView.tag);
    react_native_assert(
        subVisitedOtherNewIt == subVisitedNewMap->end() ||
        subVisitedOtherNewIt->second->shadowView.tag ==
            treeChildPair.shadowView.tag);
    react_native_assert(
        subVisitedOtherOldIt == subVisitedOldMap->end() ||
        subVisitedOtherOldIt->second->shadowView.tag ==
            treeChildPair.shadowView.tag);

    bool alreadyUpdated = false;

    // Find in other tree and updated `otherTreePair` pointers
    if (existsInOtherTree) {
      react_native_assert(otherTreeNodePairPtr != nullptr);
      auto newTreeNodePair =
          (reparentMode == ReparentMode::Flatten ? otherTreeNodePairPtr
                                                 : &treeChildPair);
      auto oldTreeNodePair =
          (reparentMode == ReparentMode::Flatten ? &treeChildPair
                                                 : otherTreeNodePairPtr);

      react_native_assert(newTreeNodePair->shadowView.tag != 0);
      react_native_assert(oldTreeNodePair->shadowView.tag != 0);
      react_native_assert(
          oldTreeNodePair->shadowView.tag == newTreeNodePair->shadowView.tag);

      alreadyUpdated =
          newTreeNodePair->inOtherTree() || oldTreeNodePair->inOtherTree();

      // We want to update these values unconditionally. Always do this
      // before hitting any "continue" statements.
      newTreeNodePair->otherTreePair = oldTreeNodePair;
      oldTreeNodePair->otherTreePair = newTreeNodePair;
      react_native_assert(treeChildPair.otherTreePair != nullptr);
    }

    // Remove all children (non-recursively) of tree being flattened, or
    // insert children into parent tree if they're being unflattened.
    //  Caller will take care of the corresponding action in the other tree
    //  (caller will handle DELETE case if we REMOVE here; caller will handle
    //  CREATE case if we INSERT here).
    if (treeChildPair.isConcreteView) {
      if (reparentMode == ReparentMode::Flatten) {
        // treeChildPair.shadowView represents the "old" view in this case.
        // If there's a "new" view, an UPDATE new -> old will be generated
        // and will be executed before the REMOVE. Thus, we must actually
        // perform a REMOVE (new view) FROM (old index) in this case so that
        // we don't hit asserts in StubViewTree's REMOVE path.
        // We also only do this if the "other" (newer) view is concrete. If
        // it's not concrete, there will be no UPDATE mutation.
        react_native_assert(existsInOtherTree == treeChildPair.inOtherTree());
        if (treeChildPair.inOtherTree() &&
            treeChildPair.otherTreePair->isConcreteView) {
          mutationContainer.removeMutations.push_back(
              ShadowViewMutation::RemoveMutation(
                  node.shadowView.tag,
                  treeChildPair.otherTreePair->shadowView,
                  static_cast<int>(treeChildPair.mountIndex)));
        } else {
          mutationContainer.removeMutations.push_back(
              ShadowViewMutation::RemoveMutation(
                  node.shadowView.tag,
                  treeChildPair.shadowView,
                  static_cast<int>(treeChildPair.mountIndex)));
        }
      } else {
        // treeChildParent represents the "new" version of the node, so
        // we can safely insert it without checking in the other tree
        mutationContainer.insertMutations.push_back(
            ShadowViewMutation::InsertMutation(
                node.shadowView.tag,
                treeChildPair.shadowView,
                static_cast<int>(treeChildPair.mountIndex)));
      }
    }

    // Find in other tree
    if (existsInOtherTree) {
      react_native_assert(otherTreeNodePairPtr != nullptr);
      auto& otherTreeNodePair = *otherTreeNodePairPtr;

      auto& newTreeNodePair =
          (reparentMode == ReparentMode::Flatten ? otherTreeNodePair
                                                 : treeChildPair);
      auto& oldTreeNodePair =
          (reparentMode == ReparentMode::Flatten ? treeChildPair
                                                 : otherTreeNodePair);

      react_native_assert(newTreeNodePair.shadowView.tag != 0);
      react_native_assert(oldTreeNodePair.shadowView.tag != 0);
      react_native_assert(
          oldTreeNodePair.shadowView.tag == newTreeNodePair.shadowView.tag);

      // If we've already done updates, don't repeat it.
      if (alreadyUpdated) {
        continue;
      }

      // If we've already done updates on this node, don't repeat.
      if (reparentMode == ReparentMode::Flatten &&
          unvisitedIt == unvisitedOtherNodes.end() &&
          subVisitedOtherOldIt != subVisitedOldMap->end()) {
        continue;
      } else if (
          reparentMode == ReparentMode::Unflatten &&
          unvisitedIt == unvisitedOtherNodes.end() &&
          subVisitedOtherNewIt != subVisitedNewMap->end()) {
        continue;
      }

      // TODO: compare ShadowNode pointer instead of ShadowView here?
      // Or ShadowNode ptr comparison before comparing ShadowView, to allow for
      // short-circuiting? ShadowView comparison is relatively expensive vs
      // ShadowNode.
      if (newTreeNodePair.shadowView != oldTreeNodePair.shadowView &&
          newTreeNodePair.isConcreteView && oldTreeNodePair.isConcreteView) {
        // We execute updates before creates, so pass the current parent in when
        // unflattening.
        // TODO: whenever we insert, we already update the relevant properties,
        // so this update is redundant. We should remove this.
        mutationContainer.updateMutations.push_back(
            ShadowViewMutation::UpdateMutation(
                oldTreeNodePair.shadowView,
                newTreeNodePair.shadowView,
                parentTagForUpdate));
      }

      auto adjustedOldCullingContext = reparentMode == ReparentMode::Flatten
          ? cullingContext.adjustCullingContextIfNeeded(oldTreeNodePair)
          : cullingContextForUnvisitedOtherNodes.adjustCullingContextIfNeeded(
                oldTreeNodePair);
      auto adjustedNewCullingContext = reparentMode == ReparentMode::Flatten
          ? cullingContextForUnvisitedOtherNodes.adjustCullingContextIfNeeded(
                newTreeNodePair)
          : cullingContext.adjustCullingContextIfNeeded(newTreeNodePair);

      // Update children if appropriate.
      if (!oldTreeNodePair.flattened && !newTreeNodePair.flattened) {
        if (oldTreeNodePair.shadowNode != newTreeNodePair.shadowNode ||
            adjustedOldCullingContext != adjustedNewCullingContext) {
          ViewNodePairScope innerScope{};
          auto oldGrandChildPairs =
              sliceChildShadowNodeViewPairsFromViewNodePair(
                  oldTreeNodePair,
                  innerScope,
                  false,
                  adjustedOldCullingContext);
          auto newGrandChildPairs =
              sliceChildShadowNodeViewPairsFromViewNodePair(
                  newTreeNodePair,
                  innerScope,
                  false,
                  adjustedNewCullingContext);

          calculateShadowViewMutations(
              innerScope,
              mutationContainer.downwardMutations,
              newTreeNodePair.shadowView.tag,
              std::move(oldGrandChildPairs),
              std::move(newGrandChildPairs),
              adjustedOldCullingContext,
              adjustedNewCullingContext);
        }
      } else if (oldTreeNodePair.flattened != newTreeNodePair.flattened) {
        // We need to handle one of the children being flattened or
        // unflattened, in the context of a parent flattening or unflattening.
        ReparentMode childReparentMode =
            (oldTreeNodePair.flattened ? ReparentMode::Unflatten
                                       : ReparentMode::Flatten);

        // Case 1: child mode is the same as parent.
        // This is a flatten-flatten, or unflatten-unflatten.
        if (childReparentMode == reparentMode) {
          calculateShadowViewMutationsFlattener(
              scope,
              childReparentMode,
              mutationContainer,
              (reparentMode == ReparentMode::Flatten
                   ? parentTag
                   : newTreeNodePair.shadowView.tag),
              unvisitedOtherNodes,
              treeChildPair,
              (reparentMode == ReparentMode::Flatten
                   ? oldTreeNodePair.shadowView.tag
                   : (ReactNativeFeatureFlags::
                              fixDifferentiatorParentTagForUnflattenCase()
                          ? parentTagForUpdate
                          : parentTag)),
              subVisitedNewMap,
              subVisitedOldMap,
              cullingContextForUnvisitedOtherNodes,
              cullingContext.adjustCullingContextIfNeeded(treeChildPair));
        } else {
          // Get flattened nodes from either new or old tree
          auto flattenedNodes = sliceChildShadowNodeViewPairsFromViewNodePair(
              (childReparentMode == ReparentMode::Flatten ? newTreeNodePair
                                                          : oldTreeNodePair),
              scope,
              true,
              childReparentMode == ReparentMode::Flatten
                  ? adjustedNewCullingContext
                  : adjustedOldCullingContext);
          // Construct unvisited nodes map
          std::unordered_map<Tag, ShadowViewNodePair*>
              unvisitedRecursiveChildPairs;
          unvisitedRecursiveChildPairs.reserve(flattenedNodes.size());
          for (auto& flattenedNode : flattenedNodes) {
            auto& newChild = *flattenedNode;

            auto unvisitedOtherNodesIt =
                unvisitedOtherNodes.find(newChild.shadowView.tag);
            if (unvisitedOtherNodesIt != unvisitedOtherNodes.end()) {
              auto unvisitedItPair = *unvisitedOtherNodesIt->second;
              unvisitedRecursiveChildPairs.insert(
                  {unvisitedItPair.shadowView.tag, &unvisitedItPair});
            } else {
              unvisitedRecursiveChildPairs.insert(
                  {newChild.shadowView.tag, &newChild});
            }
          }

          if (childReparentMode == ReparentMode::Flatten) {
            // Unflatten parent, flatten child
            react_native_assert(reparentMode == ReparentMode::Unflatten);
            auto fixedParentTagForUpdate = newTreeNodePair.shadowView.tag;
            // Flatten old tree into new list
            // At the end of this loop we still want to know which of these
            // children are visited, so we reuse the `newRemainingPairs` map.
            calculateShadowViewMutationsFlattener(
                scope,
                ReparentMode::Flatten,
                mutationContainer,
                newTreeNodePair.shadowView.tag,
                unvisitedRecursiveChildPairs,
                oldTreeNodePair,
                fixedParentTagForUpdate,
                subVisitedNewMap,
                subVisitedOldMap,
                adjustedNewCullingContext,
                adjustedNewCullingContext);
          } else {
            // Flatten parent, unflatten child
            react_native_assert(reparentMode == ReparentMode::Flatten);
            // Unflatten old list into new tree
            auto fixedParentTagForUpdate = parentTagForUpdate;
            calculateShadowViewMutationsFlattener(
                scope,
                /* reparentMode */ ReparentMode::Unflatten,
                mutationContainer,
                parentTag,
                /* unvisitedOtherNodes */ unvisitedRecursiveChildPairs,
                /* node */ newTreeNodePair,
                /* parentTagForUpdate */ fixedParentTagForUpdate,
                /* parentSubVisitedOtherNewNodes */ subVisitedNewMap,
                /* parentSubVisitedOtherOldNodes */ subVisitedOldMap,
                /* cullingContextForUnvisitedOtherNodes */
                adjustedOldCullingContext,
                /* cullingContext */ adjustedOldCullingContext);

            // If old nodes were not visited, we know that we can delete them
            // now. They will be removed from the hierarchy by the outermost
            // loop of this function.
            for (auto& unvisitedRecursiveChildPair :
                 unvisitedRecursiveChildPairs) {
              auto& oldFlattenedNode = *unvisitedRecursiveChildPair.second;

              // Node unvisited - mark the entire subtree for deletion
              if (oldFlattenedNode.isConcreteView &&
                  !oldFlattenedNode.inOtherTree()) {
                Tag tag = oldFlattenedNode.shadowView.tag;
                auto deleteCreateIt = deletionCreationCandidatePairs.find(
                    oldFlattenedNode.shadowView.tag);
                if (deleteCreateIt == deletionCreationCandidatePairs.end()) {
                  deletionCreationCandidatePairs.insert(
                      {tag, &oldFlattenedNode});
                }
              } else {
                // Node was visited - make sure to remove it from
                // "newRemainingPairs" map
                auto newRemainingIt =
                    unvisitedOtherNodes.find(oldFlattenedNode.shadowView.tag);
                if (newRemainingIt != unvisitedOtherNodes.end()) {
                  unvisitedOtherNodes.erase(newRemainingIt);
                }
              }
            }
          }
        }
      }

      // Mark that node exists in another tree, but only if the tree node is a
      // concrete view. Removing the node from the unvisited list prevents the
      // caller from taking further action on this node, so make sure to
      // delete/create if the Concreteness of the node has changed.
      if (newTreeNodePair.isConcreteView != oldTreeNodePair.isConcreteView) {
        if (newTreeNodePair.isConcreteView) {
          mutationContainer.createMutations.push_back(
              ShadowViewMutation::CreateMutation(newTreeNodePair.shadowView));
        } else {
          mutationContainer.deleteMutations.push_back(
              ShadowViewMutation::DeleteMutation(oldTreeNodePair.shadowView));
        }
      }

      subVisitedNewMap->insert(
          {newTreeNodePair.shadowView.tag, &newTreeNodePair});
      subVisitedOldMap->insert(
          {oldTreeNodePair.shadowView.tag, &oldTreeNodePair});
    } else {
      // Node does not in exist in other tree.
      if (treeChildPair.isConcreteView && !treeChildPair.inOtherTree()) {
        auto deletionCreationIt =
            deletionCreationCandidatePairs.find(treeChildPair.shadowView.tag);
        if (deletionCreationIt == deletionCreationCandidatePairs.end()) {
          deletionCreationCandidatePairs.insert(
              {treeChildPair.shadowView.tag, &treeChildPair});
        }
      }
    }
  }

  // Final step: go through creation/deletion candidates and delete/create
  // subtrees if they were never visited during the execution of the above
  // loop and recursions.
  for (auto& deletionCreationCandidatePair : deletionCreationCandidatePairs) {
    auto& treeChildPair = *deletionCreationCandidatePair.second;

    // If node was visited during a flattening/unflattening recursion,
    // and the node in the other tree is concrete, that means it was
    // already created/deleted and we don't need to do that here.
    // It is always the responsibility of the matcher to update subtrees when
    // nodes are matched.
    if (treeChildPair.inOtherTree()) {
      continue;
    }

    auto adjustedCullingContext =
        cullingContext.adjustCullingContextIfNeeded(treeChildPair);

    if (reparentMode == ReparentMode::Flatten) {
      mutationContainer.deleteMutations.push_back(
          ShadowViewMutation::DeleteMutation(treeChildPair.shadowView));

      if (!treeChildPair.flattened) {
        ViewNodePairScope innerScope{};
        calculateShadowViewMutations(
            innerScope,
            mutationContainer.destructiveDownwardMutations,
            treeChildPair.shadowView.tag,
            sliceChildShadowNodeViewPairsFromViewNodePair(
                treeChildPair, innerScope, false, adjustedCullingContext),
            {},
            adjustedCullingContext,
            {});
      }
    } else {
      mutationContainer.createMutations.push_back(
          ShadowViewMutation::CreateMutation(treeChildPair.shadowView));

      if (!treeChildPair.flattened) {
        ViewNodePairScope innerScope{};
        calculateShadowViewMutations(
            innerScope,
            mutationContainer.downwardMutations,
            treeChildPair.shadowView.tag,
            {},
            sliceChildShadowNodeViewPairsFromViewNodePair(
                treeChildPair, innerScope, false, adjustedCullingContext),
            {},
            adjustedCullingContext);
      }
    }
  }
}

static void calculateShadowViewMutations(
    ViewNodePairScope& scope,
    ShadowViewMutation::List& mutations,
    Tag parentTag,
    std::vector<ShadowViewNodePair*>&& oldChildPairs,
    std::vector<ShadowViewNodePair*>&& newChildPairs,
    const CullingContext& oldCullingContext,
    const CullingContext& newCullingContext) {
  if (oldChildPairs.empty() && newChildPairs.empty()) {
    return;
  }

  size_t index = 0;

  // Lists of mutations
  auto mutationContainer = OrderedMutationInstructionContainer{};

  DEBUG_LOGS({
    LOG(ERROR) << "Differ Entry: Child Pairs of node: [" << parentTag << "]";
    LOG(ERROR) << "> Old Child Pairs: " << oldChildPairs;
    LOG(ERROR) << "> New Child Pairs: " << newChildPairs;
  });

  // Stage 1: Collecting `Update` mutations
  for (index = 0; index < oldChildPairs.size() && index < newChildPairs.size();
       index++) {
    auto& oldChildPair = *oldChildPairs[index];
    auto& newChildPair = *newChildPairs[index];

    if (oldChildPair.shadowView.tag != newChildPair.shadowView.tag) {
      DEBUG_LOGS({
        LOG(ERROR) << "Differ Branch 1.1: Tags Different: ["
                   << oldChildPair.shadowView.tag << "] ["
                   << newChildPair.shadowView.tag << "]" << " with parent: ["
                   << parentTag << "]";
      });

      // Totally different nodes, updating is impossible.
      break;
    }

    // If either view was flattened, and that has changed this frame, don't
    // try to update
    if (oldChildPair.flattened != newChildPair.flattened ||
        oldChildPair.isConcreteView != newChildPair.isConcreteView) {
      break;
    }

    DEBUG_LOGS({
      LOG(ERROR) << "Differ Branch 1.2: Same tags, update and recurse: "
                 << oldChildPair << " and " << newChildPair << " with parent: ["
                 << parentTag << "]";
    });

    if (newChildPair.isConcreteView &&
        oldChildPair.shadowView != newChildPair.shadowView) {
      mutationContainer.updateMutations.push_back(
          ShadowViewMutation::UpdateMutation(
              oldChildPair.shadowView, newChildPair.shadowView, parentTag));
    }

    auto adjustedOldCullingContext =
        oldCullingContext.adjustCullingContextIfNeeded(oldChildPair);
    auto adjustedNewCullingContext =
        newCullingContext.adjustCullingContextIfNeeded(newChildPair);

    // Recursively update tree if ShadowNode pointers are not equal
    if (!oldChildPair.flattened &&
        (oldChildPair.shadowNode != newChildPair.shadowNode ||
         adjustedOldCullingContext != adjustedNewCullingContext)) {
      ViewNodePairScope innerScope{};
      auto oldGrandChildPairs = sliceChildShadowNodeViewPairsFromViewNodePair(
          oldChildPair, innerScope, false, adjustedOldCullingContext);
      auto newGrandChildPairs = sliceChildShadowNodeViewPairsFromViewNodePair(
          newChildPair, innerScope, false, adjustedNewCullingContext);

      const size_t newGrandChildPairsSize = newGrandChildPairs.size();

      calculateShadowViewMutations(
          innerScope,
          *(newGrandChildPairsSize != 0u
                ? &mutationContainer.downwardMutations
                : &mutationContainer.destructiveDownwardMutations),
          oldChildPair.shadowView.tag,
          std::move(oldGrandChildPairs),
          std::move(newGrandChildPairs),
          adjustedOldCullingContext,
          adjustedNewCullingContext);
    }
  }

  size_t lastIndexAfterFirstStage = index;

  if (index == newChildPairs.size()) {
    // We've reached the end of the new children. We can delete+remove the
    // rest.
    for (; index < oldChildPairs.size(); index++) {
      const auto& oldChildPair = *oldChildPairs[index];

      DEBUG_LOGS({
        LOG(ERROR) << "Differ Branch 2: Deleting Tag/Tree: " << oldChildPair
                   << " with parent: [" << parentTag << "]";
      });

      if (!oldChildPair.isConcreteView) {
        continue;
      }

      mutationContainer.deleteMutations.push_back(
          ShadowViewMutation::DeleteMutation(oldChildPair.shadowView));
      mutationContainer.removeMutations.push_back(
          ShadowViewMutation::RemoveMutation(
              parentTag,
              oldChildPair.shadowView,
              static_cast<int>(oldChildPair.mountIndex)));
      auto oldCullingContextCopy =
          oldCullingContext.adjustCullingContextIfNeeded(oldChildPair);

      // We also have to call the algorithm recursively to clean up the entire
      // subtree starting from the removed view.
      ViewNodePairScope innerScope{};
      calculateShadowViewMutations(
          innerScope,
          mutationContainer.destructiveDownwardMutations,
          oldChildPair.shadowView.tag,
          sliceChildShadowNodeViewPairsFromViewNodePair(
              oldChildPair, innerScope, false, oldCullingContextCopy),
          {},
          oldCullingContextCopy,
          newCullingContext);
    }
  } else if (index == oldChildPairs.size()) {
    // If we don't have any more existing children we can choose a fast path
    // since the rest will all be create+insert.
    for (; index < newChildPairs.size(); index++) {
      const auto& newChildPair = *newChildPairs[index];

      DEBUG_LOGS({
        LOG(ERROR) << "Differ Branch 3: Creating Tag/Tree: " << newChildPair
                   << " with parent: [" << parentTag << "]";
      });

      if (!newChildPair.isConcreteView) {
        continue;
      }

      mutationContainer.insertMutations.push_back(
          ShadowViewMutation::InsertMutation(
              parentTag,
              newChildPair.shadowView,
              static_cast<int>(newChildPair.mountIndex)));
      mutationContainer.createMutations.push_back(
          ShadowViewMutation::CreateMutation(newChildPair.shadowView));
      auto newCullingContextCopy =
          newCullingContext.adjustCullingContextIfNeeded(newChildPair);

      ViewNodePairScope innerScope{};
      calculateShadowViewMutations(
          innerScope,
          mutationContainer.downwardMutations,
          newChildPair.shadowView.tag,
          {},
          sliceChildShadowNodeViewPairsFromViewNodePair(
              newChildPair, innerScope, false, newCullingContextCopy),
          oldCullingContext,
          newCullingContextCopy);
    }
  } else {
    // Greedy Stage 4 algorithm.
    // Collect map of tags in the new list
    auto remainingCount = newChildPairs.size() - lastIndexAfterFirstStage;
    std::unordered_map<Tag, ShadowViewNodePair*> newRemainingPairs;
    newRemainingPairs.reserve(remainingCount);
    std::unordered_map<Tag, ShadowViewNodePair*> newInsertedPairs;
    newInsertedPairs.reserve(remainingCount);
    std::unordered_map<Tag, const ShadowViewNodePair*> deletionCandidatePairs{};
    for (index = lastIndexAfterFirstStage; index < newChildPairs.size();
         index++) {
      auto& newChildPair = *newChildPairs[index];
      newRemainingPairs.insert({newChildPair.shadowView.tag, &newChildPair});
    }

    // Walk through both lists at the same time
    // We will perform updates, create+insert, remove+delete, remove+insert
    // (move) here.
    size_t oldIndex = lastIndexAfterFirstStage;
    size_t newIndex = lastIndexAfterFirstStage;
    size_t newSize = newChildPairs.size();
    size_t oldSize = oldChildPairs.size();
    while (newIndex < newSize || oldIndex < oldSize) {
      bool haveNewPair = newIndex < newSize;
      bool haveOldPair = oldIndex < oldSize;

      // Advance both pointers if pointing to the same element
      if (haveNewPair && haveOldPair) {
        const auto& oldChildPair = *oldChildPairs[oldIndex];
        const auto& newChildPair = *newChildPairs[newIndex];

        Tag newTag = newChildPair.shadowView.tag;
        Tag oldTag = oldChildPair.shadowView.tag;

        if (newTag == oldTag) {
          DEBUG_LOGS({
            LOG(ERROR) << "Differ Branch 4: Matched Tags at indices: "
                       << oldIndex << " and " << newIndex << ": "
                       << oldChildPair << " and " << newChildPair
                       << " with parent: [" << parentTag << "]";
          });

          updateMatchedPair(
              mutationContainer,
              true,
              true,
              parentTag,
              oldChildPair,
              newChildPair);

          updateMatchedPairSubtrees(
              scope,
              mutationContainer,
              newRemainingPairs,
              oldChildPairs,
              parentTag,
              oldChildPair,
              newChildPair,
              oldCullingContext,
              newCullingContext);

          newIndex++;
          oldIndex++;
          continue;
        }
      }

      // We have an old pair, but we either don't have any remaining new pairs
      // or we have one but it's not matched up with the old pair
      if (haveOldPair) {
        const auto& oldChildPair = *oldChildPairs[oldIndex];

        Tag oldTag = oldChildPair.shadowView.tag;

        // Was oldTag already inserted? This indicates a reordering, not just
        // a move. The new node has already been inserted, we just need to
        // remove the node from its old position now, and update the node's
        // subtree.
        const auto insertedIt = newInsertedPairs.find(oldTag);
        if (insertedIt != newInsertedPairs.end()) {
          const auto& newChildPair = *insertedIt->second;

          DEBUG_LOGS({
            LOG(ERROR) << "Differ Branch 5: Founded reordered tags at indices: "
                       << oldIndex << ": " << oldChildPair << " and "
                       << newChildPair << " with parent: [" << parentTag << "]";
          });

          updateMatchedPair(
              mutationContainer,
              true,
              false,
              parentTag,
              oldChildPair,
              newChildPair);

          updateMatchedPairSubtrees(
              scope,
              mutationContainer,
              newRemainingPairs,
              oldChildPairs,
              parentTag,
              oldChildPair,
              newChildPair,
              oldCullingContext,
              newCullingContext);

          newInsertedPairs.erase(insertedIt);
          oldIndex++;
          continue;
        }

        // Should we generate a delete+remove instruction for the old node?
        // If there's an old node and it's not found in the "new" list, we
        // generate remove+delete for this node and its subtree.
        const auto newIt = newRemainingPairs.find(oldTag);
        if (newIt == newRemainingPairs.end()) {
          oldIndex++;

          if (!oldChildPair.isConcreteView) {
            continue;
          }

          // From here, we know the oldChildPair is concrete.
          // We *probably* need to generate a REMOVE mutation (see edge-case
          // notes below).

          DEBUG_LOGS({
            LOG(ERROR)
                << "Differ Branch 6: Removing tag that was not re-inserted: "
                << oldChildPair << " with parent: [" << parentTag
                << "], which is " << (oldChildPair.inOtherTree() ? "" : "not ")
                << "in other tree";
          });

          // Edge case: node is not found in `newRemainingPairs`, due to
          // complex (un)flattening cases, but exists in other tree *and* is
          // concrete.
          if (oldChildPair.inOtherTree() &&
              oldChildPair.otherTreePair->isConcreteView) {
            const ShadowView& otherTreeView =
                oldChildPair.otherTreePair->shadowView;

            // Remove, but remove using the *new* node, since we know
            // an UPDATE mutation from old -> new has been generated.
            // Practically this shouldn't matter for most mounting layer
            // implementations, but helps adhere to the invariant that
            // for all mutation instructions, "oldViewShadowNode" == "current
            // node on mounting layer / stubView".
            // Here we do *not" need to generate a potential DELETE mutation
            // because we know the view is concrete, and still in the new
            // hierarchy.
            mutationContainer.removeMutations.push_back(
                ShadowViewMutation::RemoveMutation(
                    parentTag,
                    otherTreeView,
                    static_cast<int>(oldChildPair.mountIndex)));
            continue;
          }

          mutationContainer.removeMutations.push_back(
              ShadowViewMutation::RemoveMutation(
                  parentTag,
                  oldChildPair.shadowView,
                  static_cast<int>(oldChildPair.mountIndex)));

          deletionCandidatePairs.insert(
              {oldChildPair.shadowView.tag, &oldChildPair});

          continue;
        }
      }

      // At this point, oldTag is -1 or is in the new list, and hasn't been
      // inserted or matched yet. We're not sure yet if the new node is in the
      // old list - generate an insert instruction for the new node.
      auto& newChildPair = *newChildPairs[newIndex];
      DEBUG_LOGS({
        LOG(ERROR)
            << "Differ Branch 7: Inserting tag/tree that was not (yet?) removed from hierarchy: "
            << newChildPair << " @ " << newIndex << "/" << newSize
            << " with parent: [" << parentTag << "]";
      });
      if (newChildPair.isConcreteView) {
        mutationContainer.insertMutations.push_back(
            ShadowViewMutation::InsertMutation(
                parentTag,
                newChildPair.shadowView,
                static_cast<int>(newChildPair.mountIndex)));
      }

      // `inOtherTree` is only set to true during flattening/unflattening of
      // parent. If the parent isn't (un)flattened, this will always be
      // `false`, even if the node is in the other (old) tree. In this case,
      // we expect the node to be removed from `newInsertedPairs` when we
      // later encounter it in this loop.
      if (!newChildPair.inOtherTree()) {
        newInsertedPairs.insert({newChildPair.shadowView.tag, &newChildPair});
      }

      newIndex++;
    }

    // Penultimate step: generate Delete instructions for entirely deleted
    // subtrees/nodes. We do this here because we need to traverse the entire
    // list to make sure that a node was not reparented into an unflattened
    // node that occurs *after* it in the hierarchy, due to zIndex ordering.
    for (auto& deletionCandidatePair : deletionCandidatePairs) {
      const auto& oldChildPair = *deletionCandidatePair.second;

      DEBUG_LOGS({
        LOG(ERROR)
            << "Differ Branch 8: Deleting tag/tree that was not in new hierarchy: "
            << oldChildPair
            << (oldChildPair.inOtherTree() ? "(in other tree)" : "")
            << " with parent: [" << parentTag << "] ##"
            << std::hash<ShadowView>{}(oldChildPair.shadowView);
      });

      // This can happen when the parent is unflattened
      if (!oldChildPair.inOtherTree() && oldChildPair.isConcreteView) {
        mutationContainer.deleteMutations.push_back(
            ShadowViewMutation::DeleteMutation(oldChildPair.shadowView));
        auto oldCullingContextCopy =
            oldCullingContext.adjustCullingContextIfNeeded(oldChildPair);

        // We also have to call the algorithm recursively to clean up the
        // entire subtree starting from the removed view.
        ViewNodePairScope innerScope{};

        auto newGrandChildPairs = sliceChildShadowNodeViewPairsFromViewNodePair(
            oldChildPair, innerScope, false, oldCullingContextCopy);
        calculateShadowViewMutations(
            innerScope,
            mutationContainer.destructiveDownwardMutations,
            oldChildPair.shadowView.tag,
            std::move(newGrandChildPairs),
            {},
            oldCullingContextCopy,
            newCullingContext);
      }
    }

    // Final step: generate Create instructions for entirely new
    // subtrees/nodes that are not the result of flattening or unflattening.
    for (auto& newInsertedPair : newInsertedPairs) {
      const auto& newChildPair = *newInsertedPair.second;

      DEBUG_LOGS({
        LOG(ERROR)
            << "Differ Branch 9: Inserting tag/tree that was not in old hierarchy: "
            << newChildPair
            << (newChildPair.inOtherTree() ? "(in other tree)" : "")
            << " with parent: [" << parentTag << "]";
      });

      if (!newChildPair.isConcreteView) {
        continue;
      }
      if (newChildPair.inOtherTree()) {
        continue;
      }

      mutationContainer.createMutations.push_back(
          ShadowViewMutation::CreateMutation(newChildPair.shadowView));

      auto newCullingContextCopy =
          newCullingContext.adjustCullingContextIfNeeded(newChildPair);

      ViewNodePairScope innerScope{};

      calculateShadowViewMutations(
          innerScope,
          mutationContainer.downwardMutations,
          newChildPair.shadowView.tag,
          {},
          sliceChildShadowNodeViewPairsFromViewNodePair(
              newChildPair, innerScope, false, newCullingContextCopy),
          oldCullingContext,
          newCullingContextCopy);
    }
  }

  // All mutations in an optimal order:
  std::move(
      mutationContainer.destructiveDownwardMutations.begin(),
      mutationContainer.destructiveDownwardMutations.end(),
      std::back_inserter(mutations));
  std::move(
      mutationContainer.updateMutations.begin(),
      mutationContainer.updateMutations.end(),
      std::back_inserter(mutations));
  std::move(
      mutationContainer.removeMutations.rbegin(),
      mutationContainer.removeMutations.rend(),
      std::back_inserter(mutations));
  std::move(
      mutationContainer.deleteMutations.begin(),
      mutationContainer.deleteMutations.end(),
      std::back_inserter(mutations));
  std::move(
      mutationContainer.createMutations.begin(),
      mutationContainer.createMutations.end(),
      std::back_inserter(mutations));
  std::move(
      mutationContainer.downwardMutations.begin(),
      mutationContainer.downwardMutations.end(),
      std::back_inserter(mutations));
  std::move(
      mutationContainer.insertMutations.begin(),
      mutationContainer.insertMutations.end(),
      std::back_inserter(mutations));
}

ShadowViewMutation::List calculateShadowViewMutations(
    const ShadowNode& oldRootShadowNode,
    const ShadowNode& newRootShadowNode) {
  TraceSection s("calculateShadowViewMutations");

  // Root shadow nodes must be belong the same family.
  react_native_assert(
      ShadowNode::sameFamily(oldRootShadowNode, newRootShadowNode));

  // See explanation of scope in Differentiator.h.
  ViewNodePairScope viewNodePairScope{};
  ViewNodePairScope innerViewNodePairScope{};

  auto mutations = ShadowViewMutation::List{};

  auto oldRootShadowView = ShadowView(oldRootShadowNode);
  auto newRootShadowView = ShadowView(newRootShadowNode);

  if (oldRootShadowView != newRootShadowView) {
    mutations.push_back(
        ShadowViewMutation::UpdateMutation(
            oldRootShadowView, newRootShadowView, {}));
  }

  auto sliceOne = sliceChildShadowNodeViewPairs(
      ShadowViewNodePair{.shadowNode = &oldRootShadowNode},
      viewNodePairScope,
      false /* allowFlattened */,
      {} /* layoutOffset */,
      {} /* cullingContext */);
  auto sliceTwo = sliceChildShadowNodeViewPairs(
      ShadowViewNodePair{.shadowNode = &newRootShadowNode},
      viewNodePairScope,
      false /* allowFlattened */,
      {} /* layoutOffset */,
      {} /* cullingContext */);

  mutations.reserve(256);

  calculateShadowViewMutations(
      innerViewNodePairScope,
      mutations,
      oldRootShadowNode.getTag(),
      std::move(sliceOne),
      std::move(sliceTwo));

  DEBUG_LOGS({
    LOG(ERROR) << "Differ Completed: " << mutations.size() << " mutations";
    for (size_t i = 0; i < mutations.size(); i++) {
      auto& mutation = mutations[i];
      switch (mutation.type) {
        case ShadowViewMutation::Type::Create:
          LOG(ERROR) << "[" << i << "] CREATE "
                     << mutation.newChildShadowView.tag;
          break;
        case ShadowViewMutation::Type::Delete:
          LOG(ERROR) << "[" << i << "] DELETE "
                     << mutation.oldChildShadowView.tag;
          break;
        case ShadowViewMutation::Type::Insert:
          LOG(ERROR) << "[" << i << "] INSERT "
                     << mutation.newChildShadowView.tag << " INTO "
                     << mutation.parentTag << " @ " << mutation.index;
          break;
        case ShadowViewMutation::Type::Remove:
          LOG(ERROR) << "[" << i << "] REMOVE "
                     << mutation.oldChildShadowView.tag << " FROM "
                     << mutation.parentTag << " @ " << mutation.index;
          break;
        case ShadowViewMutation::Type::Update:
          LOG(ERROR) << "[" << i << "] UPDATE "
                     << mutation.newChildShadowView.tag << " IN "
                     << mutation.parentTag;
          break;
      }
    }
  });

  return mutations;
}

} // namespace facebook::react
