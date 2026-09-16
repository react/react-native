/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <atomic>
#include <thread>
#include <vector>

#include <gtest/gtest.h>
#include <jsi/jsi.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>
#include <react/renderer/uimanager/UIManager.h>

namespace facebook::react {

class FindShadowNodeByTagTest : public ::testing::Test {
 public:
  FindShadowNodeByTagTest() {
    contextContainer_ = std::make_shared<ContextContainer>();

    ComponentDescriptorProviderRegistry componentDescriptorProviderRegistry{};
    auto eventDispatcher = EventDispatcher::Shared{};
    auto componentDescriptorRegistry =
        componentDescriptorProviderRegistry.createComponentDescriptorRegistry(
            ComponentDescriptorParameters{
                .eventDispatcher = eventDispatcher,
                .contextContainer = contextContainer_,
                .flavor = nullptr});

    componentDescriptorProviderRegistry.add(
        concreteComponentDescriptorProvider<RootComponentDescriptor>());
    componentDescriptorProviderRegistry.add(
        concreteComponentDescriptorProvider<ViewComponentDescriptor>());

    builder_ = std::make_unique<ComponentBuilder>(componentDescriptorRegistry);

    RuntimeExecutor runtimeExecutor =
        [](std::function<void(
               facebook::jsi::Runtime & runtime)>&& /*callback*/) {};
    uiManager_ =
        std::make_unique<UIManager>(runtimeExecutor, contextContainer_);
    uiManager_->setComponentDescriptorRegistry(componentDescriptorRegistry);

    buildAndCommitTree();
  }

  void TearDown() override {
    if (!surfaceStopped_) {
      uiManager_->stopSurface(surfaceId_);
    }
  }

 protected:
  std::shared_ptr<RootShadowNode> buildTree() {
    std::shared_ptr<RootShadowNode> rootNode;

    // clang-format off
    auto element =
        Element<RootShadowNode>()
          .tag(1)
          .surfaceId(surfaceId_)
          .reference(rootNode)
          .props([] {
            auto sharedProps = std::make_shared<RootProps>();
            auto& props = *sharedProps;
            props.layoutConstraints = LayoutConstraints{
                .minimumSize = {.width = 0, .height = 0},
                .maximumSize = {.width = 500, .height = 500}};
            auto& yogaStyle = props.yogaStyle;
            yogaStyle.setDimension(
                yoga::Dimension::Width,
                yoga::StyleSizeLength::points(500));
            yogaStyle.setDimension(
                yoga::Dimension::Height,
                yoga::StyleSizeLength::points(500));
            return sharedProps;
          })
          .children({
            Element<ViewShadowNode>()
              .tag(viewTag_)
              .surfaceId(surfaceId_)
              .props([] {
                auto sharedProps = std::make_shared<ViewProps>();
                auto& yogaStyle = sharedProps->yogaStyle;
                yogaStyle.setDimension(
                    yoga::Dimension::Width,
                    yoga::StyleSizeLength::points(100));
                yogaStyle.setDimension(
                    yoga::Dimension::Height,
                    yoga::StyleSizeLength::points(100));
                return sharedProps;
              })
          })
          .finalize([](RootShadowNode& shadowNode) {
            shadowNode.layoutIfNeeded();
            shadowNode.sealRecursive();
          });
    // clang-format on

    builder_->build(element);
    return rootNode;
  }

  void buildAndCommitTree() {
    auto rootNode = buildTree();

    auto layoutConstraints = LayoutConstraints{};
    auto layoutContext = LayoutContext{};
    auto shadowTree = std::make_unique<ShadowTree>(
        surfaceId_,
        layoutConstraints,
        layoutContext,
        *uiManager_,
        *contextContainer_);

    shadowTreePtr_ = shadowTree.get();

    shadowTree->commit(
        [&rootNode](const RootShadowNode& /*oldRootShadowNode*/) {
          return std::static_pointer_cast<RootShadowNode>(rootNode);
        },
        {true});

    uiManager_->startSurface(
        std::move(shadowTree),
        "test",
        folly::dynamic::object,
        DisplayMode::Visible);
  }

  SurfaceId surfaceId_{0};
  Tag viewTag_{42};
  bool surfaceStopped_{false};
  std::shared_ptr<ContextContainer> contextContainer_;
  std::unique_ptr<ComponentBuilder> builder_;
  std::unique_ptr<UIManager> uiManager_;
  ShadowTree* shadowTreePtr_{nullptr};
};

TEST_F(FindShadowNodeByTagTest, FindExistingNode) {
  auto found = uiManager_->findShadowNodeByTag_DEPRECATED(viewTag_);
  ASSERT_NE(found, nullptr);
  EXPECT_EQ(found->getTag(), viewTag_);
}

TEST_F(FindShadowNodeByTagTest, FindNonExistentNode) {
  auto found = uiManager_->findShadowNodeByTag_DEPRECATED(9999);
  EXPECT_EQ(found, nullptr);
}

TEST_F(FindShadowNodeByTagTest, SharedPtrFromRevisionSurvivesSurfaceStop) {
  // The fixed pattern: getCurrentRevision() returns a shared_ptr copy
  auto revision = shadowTreePtr_->getCurrentRevision();
  std::weak_ptr<const RootShadowNode> weakRoot = revision.rootShadowNode;
  ASSERT_FALSE(weakRoot.expired());

  // Stop the surface — releases all internal references
  {
    auto tree = uiManager_->stopSurface(surfaceId_);
    surfaceStopped_ = true;
  }

  // Old root is STILL alive — revision's shared_ptr keeps it alive
  EXPECT_FALSE(weakRoot.expired())
      << "Revision's shared_ptr should keep the root alive";

  // Safely traverse the old tree even after the surface was stopped
  const auto& children = revision.rootShadowNode->getChildren();
  ASSERT_FALSE(children.empty());
  EXPECT_EQ(children.front()->getTag(), viewTag_);
}

TEST_F(FindShadowNodeByTagTest, ConcurrentFindAndCommitStress) {
  // Stress test: multiple threads finding nodes while others rapidly commit
  // new same-family tree clones. With the old tryCommit + raw pointer pattern,
  // a committer can destroy the root between the time the finder captures the
  // raw pointer and dereferences it, causing a use-after-free detectable by
  // ASAN/TSAN.
  constexpr int kNumFinderThreads = 4;
  constexpr int kNumCommitterThreads = 2;
  constexpr auto kDuration = std::chrono::seconds(2);

  std::atomic<bool> stop{false};
  std::atomic<int32_t> findCount{0};
  std::atomic<int32_t> commitCount{0};

  std::vector<std::thread> threads;
  threads.reserve(kNumFinderThreads);

  // Finder threads: repeatedly search for the node by tag
  for (int i = 0; i < kNumFinderThreads; i++) {
    threads.emplace_back([&]() {
      while (!stop.load(std::memory_order_relaxed)) {
        auto found = uiManager_->findShadowNodeByTag_DEPRECATED(viewTag_);
        if (found) {
          EXPECT_EQ(found->getTag(), viewTag_);
          findCount.fetch_add(1, std::memory_order_relaxed);
        }
      }
    });
  }

  // Committer threads: rapidly replace the tree with same-family clones.
  // Using ShadowNode::clone() is much faster than buildTree() (no layout/
  // allocation overhead), maximizing commit throughput and the probability
  // of hitting the race window.
  for (int i = 0; i < kNumCommitterThreads; i++) {
    threads.emplace_back([&]() {
      while (!stop.load(std::memory_order_relaxed)) {
        shadowTreePtr_->commit(
            [](const RootShadowNode& oldRoot) {
              return std::static_pointer_cast<RootShadowNode>(
                  oldRoot.ShadowNode::clone(ShadowNodeFragment{}));
            },
            {});
        commitCount.fetch_add(1, std::memory_order_relaxed);
      }
    });
  }

  std::this_thread::sleep_for(kDuration);
  stop.store(true, std::memory_order_relaxed);
  for (auto& t : threads) {
    t.join();
  }

  EXPECT_GT(findCount.load(), 0);
  EXPECT_GT(commitCount.load(), 0);
}

} // namespace facebook::react
