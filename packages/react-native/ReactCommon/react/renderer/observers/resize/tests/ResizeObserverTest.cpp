/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/components/view/ViewShadowNode.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>
#include <react/renderer/observers/resize/ResizeObserver.h>

namespace facebook::react {

namespace {

constexpr ResizeObserverObserverId kObserverId{1};
constexpr uint64_t kObservationSequence{0};

LayoutMetrics layoutMetricsWithFrameSize(Float width, Float height) {
  auto layoutMetrics = EmptyLayoutMetrics;
  layoutMetrics.frame.origin = {.x = 0, .y = 0};
  layoutMetrics.frame.size = {.width = width, .height = height};
  return layoutMetrics;
}

} // namespace

/*
 * ┌─────────────────────┐
 * │<Root>               │
 * │  ┌────────────────┐ │
 * │  │<View> container│ │
 * │  │  ┌───────────┐ │ │
 * │  │  │<View>     │ │ │
 * │  │  │  target   │ │ │
 * │  │  └───────────┘ │ │
 * │  └────────────────┘ │
 * └─────────────────────┘
 */
class ResizeObserverTest : public ::testing::Test {
 protected:
  ComponentBuilder builder_;
  std::shared_ptr<RootShadowNode> rootShadowNode_;
  std::shared_ptr<ViewShadowNode> containerShadowNode_;
  std::shared_ptr<ViewShadowNode> targetShadowNode_;

  ResizeObserverTest() : builder_(simpleComponentBuilder()) {}

  void buildTree(
      const LayoutMetrics& targetLayoutMetrics,
      const LayoutMetrics& containerLayoutMetrics =
          layoutMetricsWithFrameSize(1000, 1000)) {
    // clang-format off
    auto element =
        Element<RootShadowNode>()
          .reference(rootShadowNode_)
          .tag(1)
          .children({
            Element<ViewShadowNode>()
              .tag(2)
              .reference(containerShadowNode_)
              .finalize([&](ViewShadowNode &shadowNode){
                shadowNode.setLayoutMetrics(containerLayoutMetrics);
              })
              .children({
                Element<ViewShadowNode>()
                  .tag(3)
                  .reference(targetShadowNode_)
                  .finalize([&](ViewShadowNode &shadowNode){
                    shadowNode.setLayoutMetrics(targetLayoutMetrics);
                  })
              })
          });
    // clang-format on

    builder_.build(element);
  }

  ResizeObserver makeObserver(
      ResizeObserverBoxOptions boxOptions =
          ResizeObserverBoxOptions::ContentBox) {
    return ResizeObserver{
        kObserverId,
        targetShadowNode_->getFamilyShared(),
        boxOptions,
        kObservationSequence};
  }

  // Returns a revision of the tree in which the target has been removed from
  // its parent, so `getAncestors` no longer resolves it.
  std::shared_ptr<ShadowNode> treeWithoutTarget() {
    return rootShadowNode_->cloneTree(
        containerShadowNode_->getFamily(), [](const ShadowNode& oldShadowNode) {
          return oldShadowNode.clone(
              {.props = ShadowNodeFragment::propsPlaceholder(),
               .children = ShadowNode::emptySharedShadowNodeSharedList()});
        });
  }

  // Returns a revision of the tree in which the target carries new layout
  // metrics.
  std::shared_ptr<ShadowNode> treeWithTargetLayoutMetrics(
      const LayoutMetrics& layoutMetrics) {
    return rootShadowNode_->cloneTree(
        targetShadowNode_->getFamily(), [&](const ShadowNode& oldShadowNode) {
          auto clone = oldShadowNode.clone(
              {.props = ShadowNodeFragment::propsPlaceholder()});
          static_cast<ViewShadowNode&>(*clone).setLayoutMetrics(layoutMetrics);
          return clone;
        });
  }

  static const RootShadowNode& asRoot(const std::shared_ptr<ShadowNode>& node) {
    return static_cast<const RootShadowNode&>(*node);
  }
};

#pragma mark - Box selection

TEST_F(ResizeObserverTest, initialDeliveryReportsContentBox) {
  buildTree(layoutMetricsWithFrameSize(100, 200));

  auto observer = makeObserver();
  auto result = observer.computeActiveObservation(*rootShadowNode_);

  ASSERT_TRUE(result.entry.has_value());
  EXPECT_EQ(result.observedSize.width, 100);
  EXPECT_EQ(result.observedSize.height, 200);
  EXPECT_EQ(result.entry->contentBoxSize.width, 100);
  EXPECT_EQ(result.entry->borderBoxSize.width, 100);
  EXPECT_FALSE(result.detached);
}

TEST_F(ResizeObserverTest, contentBoxSubtractsContentInsets) {
  auto layoutMetrics = layoutMetricsWithFrameSize(100, 200);
  layoutMetrics.contentInsets =
      EdgeInsets{.left = 10, .top = 20, .right = 10, .bottom = 20};
  buildTree(layoutMetrics);

  auto observer = makeObserver(ResizeObserverBoxOptions::ContentBox);
  auto result = observer.computeActiveObservation(*rootShadowNode_);

  ASSERT_TRUE(result.entry.has_value());
  EXPECT_EQ(result.entry->contentBoxSize.width, 80);
  EXPECT_EQ(result.entry->contentBoxSize.height, 160);
  // The border box is always the full frame, regardless of insets.
  EXPECT_EQ(result.entry->borderBoxSize.width, 100);
  EXPECT_EQ(result.entry->borderBoxSize.height, 200);
  EXPECT_EQ(result.observedSize.width, 80);
}

TEST_F(ResizeObserverTest, borderBoxOptionObservesFrameSize) {
  auto layoutMetrics = layoutMetricsWithFrameSize(100, 200);
  layoutMetrics.contentInsets =
      EdgeInsets{.left = 10, .top = 20, .right = 10, .bottom = 20};
  buildTree(layoutMetrics);

  auto observer = makeObserver(ResizeObserverBoxOptions::BorderBox);
  auto result = observer.computeActiveObservation(*rootShadowNode_);

  ASSERT_TRUE(result.entry.has_value());
  EXPECT_EQ(result.observedSize.width, 100);
  EXPECT_EQ(result.observedSize.height, 200);
}

TEST_F(ResizeObserverTest, devicePixelContentBoxScalesAndRounds) {
  auto layoutMetrics = layoutMetricsWithFrameSize(10.4f, 20.6f);
  layoutMetrics.pointScaleFactor = 3;
  buildTree(layoutMetrics);

  auto observer = makeObserver(ResizeObserverBoxOptions::DevicePixelContentBox);
  auto result = observer.computeActiveObservation(*rootShadowNode_);

  ASSERT_TRUE(result.entry.has_value());
  // round(10.4 * 3) == 31, round(20.6 * 3) == 62
  EXPECT_EQ(result.entry->devicePixelContentBoxSize.width, 31);
  EXPECT_EQ(result.entry->devicePixelContentBoxSize.height, 62);
  EXPECT_EQ(result.observedSize.width, 31);
}

TEST_F(ResizeObserverTest, contentBoxIsClampedToZeroWhenInsetsExceedFrame) {
  auto layoutMetrics = layoutMetricsWithFrameSize(10, 10);
  layoutMetrics.contentInsets =
      EdgeInsets{.left = 20, .top = 20, .right = 20, .bottom = 20};
  buildTree(layoutMetrics);

  auto observer = makeObserver();
  auto result = observer.computeActiveObservation(*rootShadowNode_);

  ASSERT_TRUE(result.entry.has_value());
  EXPECT_EQ(result.entry->contentBoxSize.width, 0);
  EXPECT_EQ(result.entry->contentBoxSize.height, 0);
}

TEST_F(ResizeObserverTest, contentRectOriginExcludesBorders) {
  auto layoutMetrics = layoutMetricsWithFrameSize(100, 200);
  layoutMetrics.contentInsets =
      EdgeInsets{.left = 10, .top = 20, .right = 10, .bottom = 20};
  layoutMetrics.borderWidth =
      EdgeInsets{.left = 4, .top = 6, .right = 4, .bottom = 6};
  buildTree(layoutMetrics);

  auto observer = makeObserver();
  auto result = observer.computeActiveObservation(*rootShadowNode_);

  ASSERT_TRUE(result.entry.has_value());
  // Per spec, contentRect's origin is the padding only (insets minus borders).
  EXPECT_EQ(result.entry->contentRect.origin.x, 6);
  EXPECT_EQ(result.entry->contentRect.origin.y, 14);
}

#pragma mark - Depth

TEST_F(ResizeObserverTest, targetDepthCountsPathToRootInclusive) {
  buildTree(layoutMetricsWithFrameSize(100, 200));

  auto observer = makeObserver();
  auto result = observer.computeActiveObservation(*rootShadowNode_);

  // root -> container -> target
  EXPECT_EQ(result.targetDepth, 3u);
}

#pragma mark - Change detection

TEST_F(ResizeObserverTest, unchangedSizeProducesNoEntryAfterReport) {
  buildTree(layoutMetricsWithFrameSize(100, 200));

  auto observer = makeObserver();
  auto initial = observer.computeActiveObservation(*rootShadowNode_);
  ASSERT_TRUE(initial.entry.has_value());
  observer.markAsReported(initial);

  auto second = observer.computeActiveObservation(*rootShadowNode_);
  EXPECT_FALSE(second.entry.has_value());
}

TEST_F(ResizeObserverTest, changedSizeProducesEntryAfterReport) {
  buildTree(layoutMetricsWithFrameSize(100, 200));

  auto observer = makeObserver();
  auto initial = observer.computeActiveObservation(*rootShadowNode_);
  ASSERT_TRUE(initial.entry.has_value());
  observer.markAsReported(initial);

  auto resized =
      treeWithTargetLayoutMetrics(layoutMetricsWithFrameSize(100, 300));
  auto second = observer.computeActiveObservation(asRoot(resized));

  ASSERT_TRUE(second.entry.has_value());
  EXPECT_EQ(second.observedSize.height, 300);
}

TEST_F(ResizeObserverTest, initialDeliveryHappensEvenForZeroSizedTarget) {
  buildTree(layoutMetricsWithFrameSize(0, 0));

  auto observer = makeObserver();
  EXPECT_TRUE(observer.needsInitialDeliveryCheck());

  auto result = observer.computeActiveObservation(*rootShadowNode_);

  // A 0x0 target still gets its first delivery, matching browsers.
  ASSERT_TRUE(result.entry.has_value());
  EXPECT_EQ(result.observedSize.width, 0);

  observer.markAsReported(result);
  EXPECT_FALSE(observer.needsInitialDeliveryCheck());
}

#pragma mark - Hidden targets

TEST_F(ResizeObserverTest, displayNoneTargetReportsZeroSize) {
  auto layoutMetrics = layoutMetricsWithFrameSize(100, 200);
  layoutMetrics.displayType = DisplayType::None;
  buildTree(layoutMetrics);

  auto observer = makeObserver();
  auto result = observer.computeActiveObservation(*rootShadowNode_);

  ASSERT_TRUE(result.entry.has_value());
  EXPECT_EQ(result.observedSize.width, 0);
  EXPECT_EQ(result.observedSize.height, 0);
  EXPECT_EQ(result.entry->borderBoxSize.width, 0);
}

TEST_F(ResizeObserverTest, hiddenAncestorReportsZeroSize) {
  auto containerLayoutMetrics = layoutMetricsWithFrameSize(1000, 1000);
  containerLayoutMetrics.displayType = DisplayType::None;
  buildTree(layoutMetricsWithFrameSize(100, 200), containerLayoutMetrics);

  auto observer = makeObserver();
  auto result = observer.computeActiveObservation(*rootShadowNode_);

  // Descendants of a `display: none` node are not laid out, so their own
  // metrics are not a reportable size.
  ASSERT_TRUE(result.entry.has_value());
  EXPECT_EQ(result.observedSize.width, 0);
  EXPECT_EQ(result.observedSize.height, 0);
}

#pragma mark - Detachment

TEST_F(ResizeObserverTest, detachedTargetDeliversFinalZeroEntryOnce) {
  buildTree(layoutMetricsWithFrameSize(100, 200));

  auto observer = makeObserver();
  auto initial = observer.computeActiveObservation(*rootShadowNode_);
  ASSERT_TRUE(initial.entry.has_value());
  observer.markAsReported(initial);

  auto detachedTree = treeWithoutTarget();
  auto final = observer.computeActiveObservation(asRoot(detachedTree));

  ASSERT_TRUE(final.entry.has_value());
  EXPECT_TRUE(final.detached);
  EXPECT_EQ(final.observedSize.width, 0);
  EXPECT_EQ(final.observedSize.height, 0);

  observer.markAsReported(final);
  EXPECT_TRUE(observer.hasDeliveredDetachedState());

  // The final 0x0 is delivered exactly once.
  auto afterFinal = observer.computeActiveObservation(asRoot(detachedTree));
  EXPECT_FALSE(afterFinal.entry.has_value());
}

// Regression test: a target that was already reporting 0x0 when it left the
// tree produces no final entry, because 0x0 was already delivered. Before the
// fix nothing recorded the detachment in that case, so
// `hasDeliveredDetachedState()` stayed false and
// `ResizeObserverManager::gatherActiveResizeObservations` recomputed this
// observation - walking the tree via `getAncestors` - on every subsequent
// commit to the surface, forever.
TEST_F(ResizeObserverTest, detachedStateIsRecordedWhenFinalEntryIsSuppressed) {
  auto hiddenLayoutMetrics = layoutMetricsWithFrameSize(100, 200);
  hiddenLayoutMetrics.displayType = DisplayType::None;
  buildTree(hiddenLayoutMetrics);

  auto observer = makeObserver();
  auto initial = observer.computeActiveObservation(*rootShadowNode_);
  ASSERT_TRUE(initial.entry.has_value());
  ASSERT_EQ(initial.observedSize.width, 0);
  observer.markAsReported(initial);
  ASSERT_FALSE(observer.hasDeliveredDetachedState());

  auto detachedTree = treeWithoutTarget();
  auto detachedResult = observer.computeActiveObservation(asRoot(detachedTree));

  // Suppressed: the observed box is still 0x0, so there is nothing to deliver.
  EXPECT_FALSE(detachedResult.entry.has_value());
  EXPECT_TRUE(detachedResult.detached);

  observer.updateDetachedState(detachedResult.detached);
  EXPECT_TRUE(observer.hasDeliveredDetachedState());
}

TEST_F(ResizeObserverTest, detachedStateIsClearedWhenTargetIsReattached) {
  buildTree(layoutMetricsWithFrameSize(100, 200));

  auto observer = makeObserver();
  auto initial = observer.computeActiveObservation(*rootShadowNode_);
  ASSERT_TRUE(initial.entry.has_value());
  observer.markAsReported(initial);

  auto detachedTree = treeWithoutTarget();
  auto final = observer.computeActiveObservation(asRoot(detachedTree));
  ASSERT_TRUE(final.entry.has_value());
  observer.markAsReported(final);
  ASSERT_TRUE(observer.hasDeliveredDetachedState());

  // The original tree still contains the target; observing it again must
  // resume normal delivery.
  auto reattached = observer.computeActiveObservation(*rootShadowNode_);
  ASSERT_TRUE(reattached.entry.has_value());
  EXPECT_FALSE(reattached.detached);
  observer.markAsReported(reattached);
  EXPECT_FALSE(observer.hasDeliveredDetachedState());
}

} // namespace facebook::react
