/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowTree.h"

#include <cxxreact/TraceSection.h>
#include <jsinspector-modern/tracing/PerformanceTracerSection.h>
#include <react/debug/react_native_assert.h>
#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/components/view/ViewShadowNode.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/core/LayoutPrimitives.h>
#include <react/renderer/mounting/ShadowTreeRevision.h>
#include <react/renderer/mounting/ShadowViewMutation.h>
#include <react/renderer/telemetry/TransactionTelemetry.h>
#include "updateMountedFlag.h"

#include "ShadowTreeDelegate.h"

namespace facebook::react {

namespace {
const int MAX_COMMIT_ATTEMPTS_BEFORE_LOCKING = 3;

std::string getShadowTreeCommitSourceName(ShadowTreeCommitSource source) {
  switch (source) {
    case ShadowTreeCommitSource::Unknown:
      return "Unknown";
    case ShadowTreeCommitSource::React:
      return "React";
    case ShadowTreeCommitSource::AnimationEndSync:
      return "AnimationEndSync";
    case ShadowTreeCommitSource::ReactRevisionMerge:
      return "ReactRevisionMerge";
  }
}

inline bool isPropsUpdatesAccumulationGuaranteed() {
#ifdef __ANDROID__
  return ReactNativeFeatureFlags::enableAccumulatedUpdatesInRawPropsAndroid();
#else
  return true;
#endif
}
} // namespace

using CommitStatus = ShadowTree::CommitStatus;
using CommitMode = ShadowTree::CommitMode;

/*
 * Generates (possibly) a new tree where all nodes with non-obsolete `State`
 * objects. If all `State` objects in the tree are not obsolete for the moment
 * of calling, the function returns `nullptr` (as an indication that no
 * additional work is required).
 */
static std::shared_ptr<ShadowNode> progressState(const ShadowNode& shadowNode) {
  auto isStateChanged = false;
  auto areChildrenChanged = false;

  auto newState = shadowNode.getState();
  if (newState) {
    newState = newState->getMostRecentStateIfObsolete();
    if (newState) {
      isStateChanged = true;
    }
  }

  auto newChildren = std::vector<std::shared_ptr<const ShadowNode>>{};
  if (!shadowNode.getChildren().empty()) {
    auto index = size_t{0};
    for (const auto& childNode : shadowNode.getChildren()) {
      auto newChildNode = progressState(*childNode);
      if (newChildNode) {
        if (!areChildrenChanged) {
          // Making a copy before the first mutation.
          newChildren = shadowNode.getChildren();
        }
        newChildren[index] = newChildNode;
        areChildrenChanged = true;
      }
      index++;
    }
  }

  if (!areChildrenChanged && !isStateChanged) {
    return nullptr;
  }

  return shadowNode.clone({
      .props = ShadowNodeFragment::propsPlaceholder(),
      .children = areChildrenChanged
          ? std::make_shared<
                const std::vector<std::shared_ptr<const ShadowNode>>>(
                std::move(newChildren))
          : ShadowNodeFragment::childrenPlaceholder(),
      .state =
          isStateChanged ? newState : ShadowNodeFragment::statePlaceholder(),
  });
}

/*
 * An optimized version of the previous function (and relies on it).
 * The function uses a given base tree to exclude unchanged (equal) parts
 * of the three from the traversing.
 */
static std::shared_ptr<ShadowNode> progressState(
    const ShadowNode& shadowNode,
    const ShadowNode& baseShadowNode) {
  // The intuition behind the complexity:
  // - A very few nodes have associated state, therefore it's mostly reading and
  //   it only writes when state objects were found obsolete;
  // - Most before-after trees are aligned, therefore most tree branches will be
  //   skipped;
  // - If trees are significantly different, any other algorithm will have
  //   close to linear complexity.

  auto isStateChanged = false;
  auto areChildrenChanged = false;

  auto newState = shadowNode.getState();
  if (newState) {
    newState = newState->getMostRecentStateIfObsolete();
    if (newState) {
      isStateChanged = true;
    }
  }

  auto& children = shadowNode.getChildren();
  auto& baseChildren = baseShadowNode.getChildren();
  auto newChildren = std::vector<std::shared_ptr<const ShadowNode>>{};

  auto childrenSize = children.size();
  auto baseChildrenSize = baseChildren.size();
  auto index = size_t{0};

  // Stage 1: Aligned part.
  for (index = 0; index < childrenSize && index < baseChildrenSize; index++) {
    const auto& childNode = *children[index];
    const auto& baseChildNode = *baseChildren[index];

    if (&childNode == &baseChildNode) {
      // Nodes are identical, skipping.
      continue;
    }

    if (!ShadowNode::sameFamily(childNode, baseChildNode)) {
      // Totally different nodes, updating is impossible.
      break;
    }

    auto newChildNode = progressState(childNode, baseChildNode);
    if (newChildNode) {
      if (!areChildrenChanged) {
        // Making a copy before the first mutation.
        newChildren = children;
      }
      newChildren[index] = newChildNode;
      areChildrenChanged = true;
    }
  }

  // Stage 2: Misaligned part.
  for (; index < childrenSize; index++) {
    auto newChildNode = progressState(*children[index]);
    if (newChildNode) {
      if (!areChildrenChanged) {
        // Making a copy before the first mutation.
        newChildren = children;
      }
      newChildren[index] = newChildNode;
      areChildrenChanged = true;
    }
  }

  if (!areChildrenChanged && !isStateChanged) {
    return nullptr;
  }

  return shadowNode.clone({
      .props = ShadowNodeFragment::propsPlaceholder(),
      .children = areChildrenChanged
          ? std::make_shared<
                const std::vector<std::shared_ptr<const ShadowNode>>>(
                std::move(newChildren))
          : ShadowNodeFragment::childrenPlaceholder(),
      .state =
          isStateChanged ? newState : ShadowNodeFragment::statePlaceholder(),
  });
}

/*
 * Updates the layout context and layout metrics on the RootNode for commits
 * coming from React. The RootNode is managed outside of it, and may have been
 * modified concurrently with the React revision.
 */
static std::shared_ptr<RootShadowNode> progressRootLayoutInfo(
    const std::shared_ptr<RootShadowNode>& shadowNode,
    const RootShadowNode& baseShadowNode,
    const ShadowTreeCommitOptions& commitOptions) {
  if (commitOptions.source == ShadowTreeCommitSource::React ||
      commitOptions.source == ShadowTreeCommitSource::ReactRevisionMerge) {
    const auto& mainBranchRootProps = baseShadowNode.getConcreteProps();
    const auto& jsBranchRootProps = shadowNode->getConcreteProps();

    if (mainBranchRootProps.layoutConstraints ==
            jsBranchRootProps.layoutConstraints &&
        mainBranchRootProps.layoutContext == jsBranchRootProps.layoutContext) {
      // The layout information kept in the JS branch is up to date.
      return shadowNode;
    }

    const auto clonedNode = baseShadowNode.ShadowNode::clone(
        {.children = std::make_shared<
             const std::vector<std::shared_ptr<const ShadowNode>>>(
             shadowNode->getChildren())});
    return std::static_pointer_cast<RootShadowNode>(clonedNode);
  }

  return shadowNode;
}

ShadowTree::ShadowTree(
    SurfaceId surfaceId,
    const LayoutConstraints& layoutConstraints,
    const LayoutContext& layoutContext,
    const ShadowTreeDelegate& delegate,
    const ContextContainer& contextContainer)
    : surfaceId_(surfaceId), delegate_(delegate) {
  static RootComponentDescriptor globalRootComponentDescriptor(
      ComponentDescriptorParameters{
          .eventDispatcher = EventDispatcher::Shared{},
          .contextContainer = nullptr,
          .flavor = nullptr});

  const auto props = std::make_shared<const RootProps>(
      PropsParserContext{surfaceId, contextContainer},
      *RootShadowNode::defaultSharedProps(),
      layoutConstraints,
      layoutContext);

  auto family = globalRootComponentDescriptor.createFamily(
      {.tag = surfaceId, .surfaceId = surfaceId, .instanceHandle = nullptr});

  auto rootShadowNode = std::static_pointer_cast<const RootShadowNode>(
      globalRootComponentDescriptor.createShadowNode(
          ShadowNodeFragment{
              /* .props = */ .props = props,
          },
          family));

  currentRevision_ = ShadowTreeRevision{
      .rootShadowNode = rootShadowNode,
      .number = INITIAL_REVISION,
      .telemetry = TransactionTelemetry{}};

  mountingCoordinator_ =
      std::make_shared<const MountingCoordinator>(currentRevision_);
}

ShadowTree::~ShadowTree() {
  mountingCoordinator_->revoke();
}

Tag ShadowTree::getSurfaceId() const {
  return surfaceId_;
}

void ShadowTree::setCommitMode(CommitMode commitMode) const {
  auto revision = ShadowTreeRevision{};

  {
    ShadowTree::UniqueLock lock = uniqueRevisionLock();

    if (commitMode_ == commitMode) {
      return;
    }

    commitMode_ = commitMode;
    revision = currentRevision_;
  }

  // initial revision never contains any commits so mounting it here is
  // incorrect
  if (commitMode == CommitMode::Normal && revision.number != INITIAL_REVISION) {
    mount(revision, true);
  }
}

CommitMode ShadowTree::getCommitMode() const {
  SharedLock lock = sharedRevisionLock();
  return commitMode_;
}

std::shared_ptr<const MountingCoordinator> ShadowTree::getMountingCoordinator()
    const {
  return mountingCoordinator_;
}

CommitStatus ShadowTree::commit(
    const ShadowTreeCommitTransaction& transaction,
    const CommitOptions& commitOptions) const {
  [[maybe_unused]] int attempts = 0;

  if (ReactNativeFeatureFlags::preventShadowTreeCommitExhaustion()) {
    while (attempts < MAX_COMMIT_ATTEMPTS_BEFORE_LOCKING) {
      auto status = tryCommit(transaction, commitOptions);
      if (status != CommitStatus::Failed) {
        return status;
      }
      attempts++;
    }

    {
      std::unique_lock lock(revisionMutexRecursive_);
      return tryCommit(transaction, commitOptions);
    }
  } else {
    while (true) {
      attempts++;

      auto status = tryCommit(transaction, commitOptions);
      if (status != CommitStatus::Failed) {
        return status;
      }

      // After multiple attempts, we failed to commit the transaction.
      // Something internally went terribly wrong.
      react_native_assert(attempts < 1024);
    }
  }
}

CommitStatus ShadowTree::tryCommit(
    const ShadowTreeCommitTransaction& transaction,
    const CommitOptions& commitOptions) const {
  TraceSection s("ShadowTree::commit");
  jsinspector_modern::tracing::PerformanceTracerSection s1(
      "commit",
      "Renderer",
      "\u269b Native",
      nullptr,
      "source",
      getShadowTreeCommitSourceName(commitOptions.source));

  auto isReactBranch = ReactNativeFeatureFlags::enableFabricCommitBranching() &&
      commitOptions.source == CommitSource::React;

  // Commits on the JS branch are never synchronous.
  react_native_assert(!isReactBranch || !commitOptions.mountSynchronously);

  auto telemetry = TransactionTelemetry{};
  telemetry.willCommit();

  CommitMode commitMode;
  auto oldRevision = ShadowTreeRevision{};
  auto oldRevisionForStateProgression = ShadowTreeRevision{};
  auto newRevision = ShadowTreeRevision{};

  {
    // Reading `currentRevision_` in shared manner.
    SharedLock lock = sharedRevisionLock();
    commitMode = commitMode_;

    if (isReactBranch && currentReactRevision_.has_value()) {
      oldRevision = currentReactRevision_.value();
    } else {
      oldRevision = currentRevision_;
    }

    oldRevisionForStateProgression = currentRevision_;
  }

  const auto& oldRootShadowNode = oldRevision.rootShadowNode;
  auto newRootShadowNode = transaction(*oldRevision.rootShadowNode);

  if (!newRootShadowNode) {
    return CommitStatus::Cancelled;
  }

  if (commitOptions.enableStateReconciliation) {
    auto updatedNewRootShadowNode = progressState(
        *newRootShadowNode, *oldRevisionForStateProgression.rootShadowNode);
    if (updatedNewRootShadowNode) {
      newRootShadowNode =
          std::static_pointer_cast<RootShadowNode>(updatedNewRootShadowNode);
    }
  }

  if (ReactNativeFeatureFlags::enableFabricCommitBranching()) {
    newRootShadowNode = progressRootLayoutInfo(
        newRootShadowNode,
        *oldRevisionForStateProgression.rootShadowNode,
        commitOptions);
  }

  // Run commit hooks.
  newRootShadowNode = delegate_.shadowTreeWillCommit(
      *this, oldRootShadowNode, newRootShadowNode, commitOptions);

  if (!newRootShadowNode) {
    return CommitStatus::Cancelled;
  }

  // Layout nodes.
  std::vector<const LayoutableShadowNode*> affectedLayoutableNodes{};
  affectedLayoutableNodes.reserve(1024);

  telemetry.willLayout();
  telemetry.setAsThreadLocal();
  {
    jsinspector_modern::tracing::PerformanceTracerSection s2(
        "layout", "Renderer", "\u269b Native");
    newRootShadowNode->layoutIfNeeded(&affectedLayoutableNodes);
  }
  telemetry.unsetAsThreadLocal();
  telemetry.didLayout(static_cast<int>(affectedLayoutableNodes.size()));

  {
    // Updating `currentRevision_` in unique manner if it hasn't changed.
    UniqueLock lock = uniqueRevisionLock(
        /*defer*/ isReactBranch);

    if (!isReactBranch && currentRevision_.number != oldRevision.number) {
      return CommitStatus::Failed;
    }

    auto newRevisionNumber = currentRevision_.number + 1;

    {
      std::scoped_lock dispatchLock(EventEmitter::DispatchMutex());
      updateMountedFlag(
          oldRevision.rootShadowNode->getChildren(),
          newRootShadowNode->getChildren(),
          commitOptions.source);
    }

    telemetry.didCommit();
    telemetry.setRevisionNumber(static_cast<int>(newRevisionNumber));

    // Seal the shadow node so it can no longer be mutated
    // Does nothing in release.
    newRootShadowNode->sealRecursive();

    newRevision = ShadowTreeRevision{
        .rootShadowNode = std::move(newRootShadowNode),
        .number = newRevisionNumber,
        .telemetry = telemetry};

    if (isReactBranch) {
      // Lock the deferred lock to ensure that the new React revision is not
      // reset during a scheduled merge.
      std::visit([](auto& concreteLock) { concreteLock.lock(); }, lock);
      currentReactRevision_ = newRevision;
    } else {
      currentRevision_ = newRevision;
    }
  }

  emitLayoutEvents(affectedLayoutableNodes);

  if (isReactBranch) {
    scheduleReactRevisionPromotion();
  } else if (commitMode == CommitMode::Normal) {
    mount(std::move(newRevision), commitOptions.mountSynchronously);
  }

  return CommitStatus::Succeeded;
}

ShadowTreeRevision ShadowTree::getCurrentRevision() const {
  SharedLock lock = sharedRevisionLock();
  return currentRevision_;
}

std::optional<ShadowTreeRevision> ShadowTree::getCurrentReactRevision() const {
  SharedLock lock = sharedRevisionLock();
  return currentReactRevision_;
}

void ShadowTree::mount(ShadowTreeRevision revision, bool mountSynchronously)
    const {
  mountingCoordinator_->push(std::move(revision));
  delegate_.shadowTreeDidFinishTransaction(
      mountingCoordinator_, mountSynchronously);
}

void ShadowTree::mergeReactRevision() const {
  ShadowTreeRevision promotedRevision;
  std::vector<ShadowTreeRevision> promotedRevisions;
  // If props updates accumulation is guaranteed, we can merge the promoted
  // react revision, otherwise we need to merge all queued revisions.

  {
    UniqueLock lock = uniqueRevisionLock(false);

    if (isPropsUpdatesAccumulationGuaranteed()) {
      if (!reactRevisionToBePromoted_.has_value()) {
        return;
      }

      promotedRevision =
          std::exchange(reactRevisionToBePromoted_, std::nullopt).value();
    } else {
      if (promotedReactRevisions_.empty()) {
        return;
      }

      promotedReactRevisions_.swap(promotedRevisions);
    }
  }

  ShadowTreeRevision::Number lastMergedRevisionNumber;

  if (isPropsUpdatesAccumulationGuaranteed()) {
    lastMergedRevisionNumber = promotedRevision.number;
    this->commit(
        [revision = std::move(promotedRevision)](
            const RootShadowNode& /*oldRootShadowNode*/) {
          return std::make_shared<RootShadowNode>(
              *revision.rootShadowNode, ShadowNodeFragment{});
        },
        {
            .enableStateReconciliation = true,
            .mountSynchronously = true,
            .source = CommitSource::ReactRevisionMerge,
        });
  } else {
    for (size_t i = 0; i < promotedRevisions.size(); ++i) {
      auto& revision = promotedRevisions[i];
      bool isLast = i == promotedRevisions.size() - 1;
      lastMergedRevisionNumber = revision.number;

      this->commit(
          [revision = std::move(revision)](
              const RootShadowNode& /*oldRootShadowNode*/) {
            return std::make_shared<RootShadowNode>(
                *revision.rootShadowNode, ShadowNodeFragment{});
          },
          {
              .enableStateReconciliation = isLast,
              .mountSynchronously = true,
              .source = CommitSource::ReactRevisionMerge,
          });
    }
  }

  {
    UniqueLock commitLock = uniqueRevisionLock(
        /*defer*/ false);

    // If the current react revision is the same as the one that was just
    // merged, clear it.
    if (currentReactRevision_.has_value() &&
        lastMergedRevisionNumber == currentReactRevision_.value().number) {
      currentReactRevision_.reset();
    }
  }
}

void ShadowTree::promoteReactRevision() const {
  // Promote only when props updates accumulation is guaranteed. Otherwise,
  // queuedReactRevisions_ will be used instead.
  if (isPropsUpdatesAccumulationGuaranteed()) {
    ShadowTreeRevision currentReactRevision;
    {
      SharedLock lock = sharedRevisionLock();
      // Promotion happens at the end of the event loop tick, it's possible to
      // have more than one promotion in a row. In this case, all but the first
      // one should no-op.
      if (!currentReactRevision_.has_value()) {
        return;
      }
      currentReactRevision = currentReactRevision_.value();
    }

    {
      UniqueLock lock = uniqueRevisionLock(false);
      reactRevisionToBePromoted_ = std::move(currentReactRevision);
    }
  } else {
    UniqueLock lock = uniqueRevisionLock(false);

    if (queuedReactRevisions_.empty()) {
      return;
    }

    // Move all queued revisions to the promoted revisions.
    promotedReactRevisions_.insert(
        promotedReactRevisions_.end(),
        std::make_move_iterator(queuedReactRevisions_.begin()),
        std::make_move_iterator(queuedReactRevisions_.end()));
    queuedReactRevisions_.clear();
  }

  delegate_.shadowTreeDidPromoteReactRevision(*this);
}

void ShadowTree::scheduleReactRevisionPromotion() const {
  if (!isPropsUpdatesAccumulationGuaranteed()) {
    // If props updates accumulation is not guaranteed, we need to store each
    // revision to be merged separately.
    UniqueLock lock = uniqueRevisionLock(false);
    if (currentReactRevision_.has_value()) {
      queuedReactRevisions_.push_back(currentReactRevision_.value());
    }
  }

  delegate_.shadowTreeDidFinishReactCommit(*this);
}

void ShadowTree::commitEmptyTree() const {
  commit(
      [](const RootShadowNode& oldRootShadowNode)
          -> std::shared_ptr<RootShadowNode> {
        return std::make_shared<RootShadowNode>(
            oldRootShadowNode,
            ShadowNodeFragment{
                /* .props = */ .props = ShadowNodeFragment::propsPlaceholder(),
                /* .children = */ .children =
                    ShadowNode::emptySharedShadowNodeSharedList(),
            });
      },
      {/* default commit options */});
}

void ShadowTree::emitLayoutEvents(
    std::vector<const LayoutableShadowNode*>& affectedLayoutableNodes) const {
  TraceSection s(
      "ShadowTree::emitLayoutEvents",
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

void ShadowTree::notifyDelegatesOfUpdates() const {
  delegate_.shadowTreeDidFinishTransaction(mountingCoordinator_, true);
}

inline ShadowTree::UniqueLock ShadowTree::uniqueRevisionLock(bool defer) const {
  if (ReactNativeFeatureFlags::preventShadowTreeCommitExhaustion()) {
    return defer ? std::unique_lock{revisionMutexRecursive_, std::defer_lock}
                 : std::unique_lock{revisionMutexRecursive_};
  } else {
    return defer ? std::unique_lock{revisionMutex_, std::defer_lock}
                 : std::unique_lock{revisionMutex_};
  }
}

inline ShadowTree::SharedLock ShadowTree::sharedRevisionLock() const {
  if (ReactNativeFeatureFlags::preventShadowTreeCommitExhaustion()) {
    return std::unique_lock{revisionMutexRecursive_};
  } else {
    return std::shared_lock{revisionMutex_};
  }
}

} // namespace facebook::react
