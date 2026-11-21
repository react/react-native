/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>
#include <optional>
#include <thread>

#include <folly/json.h>
#include <gtest/gtest.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#include <react/renderer/components/view/ViewShadowNode.h>
#include <react/renderer/core/MediaFeatures.h>
#include <react/renderer/element/testUtils.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerCommitHook.h>

namespace facebook::react {

namespace {

// Changes the media features on another thread, like the UI thread does,
// while a commit runs.
class SetMediaFeaturesDuringCommitHook : public UIManagerCommitHook {
 public:
  void commitHookWasRegistered(const UIManager& uiManager) noexcept override {
    uiManager_ = &uiManager;
  }

  void commitHookWasUnregistered(
      const UIManager& /*uiManager*/) noexcept override {
    uiManager_ = nullptr;
  }

  RootShadowNode::Unshared shadowTreeWillCommit(
      const ShadowTree& /*shadowTree*/,
      const std::shared_ptr<const RootShadowNode>& /*oldRootShadowNode*/,
      const RootShadowNode::Unshared& newRootShadowNode) noexcept override {
    if (mediaFeatures && uiManager_ != nullptr) {
      auto newMediaFeatures = *mediaFeatures;
      mediaFeatures.reset();
      std::thread([&] {
        uiManager_->setMediaFeatures(newMediaFeatures);
      }).join();
    }
    return newRootShadowNode;
  }

  std::optional<MediaFeatures> mediaFeatures;

 private:
  const UIManager* uiManager_{nullptr};
};

class CancelCommitHook : public UIManagerCommitHook {
 public:
  void commitHookWasRegistered(
      const UIManager& /*uiManager*/) noexcept override {}

  void commitHookWasUnregistered(
      const UIManager& /*uiManager*/) noexcept override {}

  RootShadowNode::Unshared shadowTreeWillCommit(
      const ShadowTree& /*shadowTree*/,
      const std::shared_ptr<const RootShadowNode>& /*oldRootShadowNode*/,
      const RootShadowNode::Unshared& newRootShadowNode) noexcept override {
    if (cancelNextCommit) {
      cancelNextCommit = false;
      return nullptr;
    }
    return newRootShadowNode;
  }

  bool cancelNextCommit{false};
};

} // namespace

class UIManagerMediaFeaturesTest : public ::testing::Test {
 public:
  UIManagerMediaFeaturesTest() {
    contextContainer_ = std::make_shared<ContextContainer>();
    contextContainer_->insert(
        kMediaFeaturesStoreKey, std::make_shared<MediaFeaturesStore>());

    ComponentDescriptorProviderRegistry componentDescriptorProviderRegistry{};
    auto componentDescriptorRegistry =
        componentDescriptorProviderRegistry.createComponentDescriptorRegistry(
            ComponentDescriptorParameters{
                .eventDispatcher = EventDispatcher::Shared{},
                .contextContainer = contextContainer_,
                .flavor = nullptr});
    componentDescriptorProviderRegistry.add(
        concreteComponentDescriptorProvider<RootComponentDescriptor>());
    componentDescriptorProviderRegistry.add(
        concreteComponentDescriptorProvider<ViewComponentDescriptor>());

    RuntimeExecutor runtimeExecutor =
        [](std::function<void(
               facebook::jsi::Runtime & runtime)>&& /*callback*/) {};
    uiManager_ =
        std::make_unique<UIManager>(runtimeExecutor, contextContainer_);
    uiManager_->setComponentDescriptorRegistry(componentDescriptorRegistry);

    auto shadowTree = std::make_unique<ShadowTree>(
        surfaceId_,
        LayoutConstraints{},
        LayoutContext{},
        *uiManager_,
        *contextContainer_);
    shadowTree_ = shadowTree.get();
    uiManager_->startSurface(
        std::move(shadowTree),
        "test",
        folly::dynamic::object,
        DisplayMode::Visible);
  }

  void TearDown() override {
    uiManager_->stopSurface(surfaceId_);
  }

 protected:
  // A view with opacity 1 in light mode and 0.5 in dark mode.
  std::shared_ptr<const ShadowNode> createView() {
    auto props = folly::parseJson(R"({
      "$hasConditionalValues": true,
      "opacity": {"$conditionalValue": {
        "default": 1,
        "conditions": [{"query": {"colorScheme": "dark"}, "value": 0.5}]
      }}
    })");
    return uiManager_->createNode(
        viewTag_, "View", surfaceId_, RawProps(std::move(props)), nullptr);
  }

  void reactCommit(const std::shared_ptr<const ShadowNode>& view) {
    uiManager_->completeSurface(
        surfaceId_,
        std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>(
            std::vector<std::shared_ptr<const ShadowNode>>{view}),
        // The options of `completeRoot` in `UIManagerBinding`.
        {.enableStateReconciliation = true,
         .mountSynchronously = false,
         .source = ShadowTree::CommitSource::React});
  }

  Float committedOpacity() const {
    auto root = shadowTree_->getCurrentRevision().rootShadowNode;
    return static_cast<const ViewProps&>(
               *root->getChildren().front()->getProps())
        .opacity;
  }

  SurfaceId surfaceId_{1};
  Tag viewTag_{42};
  std::shared_ptr<ContextContainer> contextContainer_;
  std::unique_ptr<UIManager> uiManager_;
  ShadowTree* shadowTree_{nullptr};
};

TEST_F(UIManagerMediaFeaturesTest, reactCommitResolvesAChangeDuringIt) {
  auto view = createView();
  reactCommit(view);
  EXPECT_FLOAT_EQ(committedOpacity(), 1);

  // React commits its light view again. During that commit, the color scheme
  // changes and its update commits first, so the React commit runs again.
  SetMediaFeaturesDuringCommitHook commitHook;
  commitHook.mediaFeatures = MediaFeatures{.colorScheme = ColorScheme::Dark};
  uiManager_->registerCommitHook(commitHook);
  reactCommit(view);
  uiManager_->unregisterCommitHook(commitHook);

  EXPECT_FALSE(commitHook.mediaFeatures.has_value());
  EXPECT_FLOAT_EQ(committedOpacity(), 0.5);
}

TEST_F(
    UIManagerMediaFeaturesTest,
    firstConditionalViewResolvesAChangeDuringItsCommit) {
  // The committed tree has no conditional values yet, only the React commit.
  SetMediaFeaturesDuringCommitHook commitHook;
  commitHook.mediaFeatures = MediaFeatures{.colorScheme = ColorScheme::Dark};
  uiManager_->registerCommitHook(commitHook);
  reactCommit(createView());
  uiManager_->unregisterCommitHook(commitHook);

  EXPECT_FALSE(commitHook.mediaFeatures.has_value());
  EXPECT_FLOAT_EQ(committedOpacity(), 0.5);
}

TEST_F(UIManagerMediaFeaturesTest, cancelledReactCommitDoesNotSaveTheChange) {
  auto view = createView();
  reactCommit(view);
  uiManager_->setMediaFeatures({.colorScheme = ColorScheme::Dark});
  EXPECT_FLOAT_EQ(committedOpacity(), 0.5);

  // The next React commit is cancelled, so the next one must resolve again.
  CancelCommitHook commitHook;
  commitHook.cancelNextCommit = true;
  uiManager_->registerCommitHook(commitHook);
  reactCommit(view);
  uiManager_->unregisterCommitHook(commitHook);
  EXPECT_FALSE(commitHook.cancelNextCommit);

  reactCommit(view);
  EXPECT_FLOAT_EQ(committedOpacity(), 0.5);
}

TEST_F(UIManagerMediaFeaturesTest, reactCommitResolvesAChangeBeforeIt) {
  auto view = createView();
  reactCommit(view);
  EXPECT_FLOAT_EQ(committedOpacity(), 1);

  uiManager_->setMediaFeatures({.colorScheme = ColorScheme::Dark});
  reactCommit(view);
  EXPECT_FLOAT_EQ(committedOpacity(), 0.5);

  uiManager_->setMediaFeatures({.colorScheme = ColorScheme::Light});
  reactCommit(view);
  EXPECT_FLOAT_EQ(committedOpacity(), 1);
}

TEST_F(UIManagerMediaFeaturesTest, reactCommitsWithoutAChangeKeepTheValue) {
  auto view = createView();
  reactCommit(view);
  EXPECT_FLOAT_EQ(committedOpacity(), 1);

  reactCommit(view);
  EXPECT_FLOAT_EQ(committedOpacity(), 1);
}

TEST_F(UIManagerMediaFeaturesTest, rootKnowsIfTheTreeHasConditionalValues) {
  auto view = createView();
  reactCommit(view);
  EXPECT_TRUE(shadowTree_->getCurrentRevision()
                  .rootShadowNode->subtreeHasConditionalValues());

  // A plain value replaces the only conditional value.
  reactCommit(uiManager_->cloneNode(
      *view, nullptr, RawProps(folly::dynamic::object("opacity", 1))));
  EXPECT_FALSE(shadowTree_->getCurrentRevision()
                   .rootShadowNode->subtreeHasConditionalValues());
}

TEST_F(UIManagerMediaFeaturesTest, aCommitOfAnOlderTreeResolvesAChange) {
  auto view = createView();
  reactCommit(view);
  auto olderRootShadowNode = shadowTree_->getCurrentRevision().rootShadowNode;

  uiManager_->setMediaFeatures({.colorScheme = ColorScheme::Dark});
  EXPECT_FLOAT_EQ(committedOpacity(), 0.5);

  // Like `updateShadowTree`, which commits a tree that it made earlier.
  shadowTree_->commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
        return std::make_shared<RootShadowNode>(
            *olderRootShadowNode, ShadowNodeFragment{});
      },
      {});
  EXPECT_FLOAT_EQ(committedOpacity(), 0.5);
}

TEST_F(UIManagerMediaFeaturesTest, aChangeDoesNotCloneViewsOfATreeWithoutThem) {
  reactCommit(uiManager_->createNode(
      viewTag_,
      "View",
      surfaceId_,
      RawProps(folly::dynamic::object("opacity", 1)),
      nullptr));
  auto revisionBeforeChange = shadowTree_->getCurrentRevision();

  // The change commits only a new root.
  uiManager_->setMediaFeatures({.colorScheme = ColorScheme::Dark});
  auto revision = shadowTree_->getCurrentRevision();
  EXPECT_EQ(revision.number, revisionBeforeChange.number + 1);
  EXPECT_EQ(
      revision.rootShadowNode->getChildren().front(),
      revisionBeforeChange.rootShadowNode->getChildren().front());
}

TEST_F(UIManagerMediaFeaturesTest, aChangeDoesNotCloneViewsThatDoNotReadIt) {
  // The query reads a feature that the color scheme change does not change.
  auto props = folly::parseJson(R"({
    "$hasConditionalValues": true,
    "opacity": {"$conditionalValue": {
      "default": 1,
      "conditions": [{"query": {"unknown": "value"}, "value": 0.5}]
    }}
  })");
  reactCommit(uiManager_->createNode(
      viewTag_, "View", surfaceId_, RawProps(std::move(props)), nullptr));
  auto committedView = [&] {
    return shadowTree_->getCurrentRevision()
        .rootShadowNode->getChildren()
        .front();
  };
  auto viewBeforeChange = committedView();

  uiManager_->setMediaFeatures({.colorScheme = ColorScheme::Dark});
  EXPECT_EQ(committedView(), viewBeforeChange);
  EXPECT_FLOAT_EQ(committedOpacity(), 1);
}

namespace {

class CommitBranchingFlags : public ReactNativeFeatureFlagsDefaults {
 public:
  bool enableFabricCommitBranching() override {
    return true;
  }
};

// A base class, so the flags are set before the fixture reads them.
class WithCommitBranching {
 public:
  WithCommitBranching() {
    ReactNativeFeatureFlags::dangerouslyReset();
    ReactNativeFeatureFlags::override(std::make_unique<CommitBranchingFlags>());
  }

  ~WithCommitBranching() {
    ReactNativeFeatureFlags::dangerouslyReset();
  }
};

} // namespace

class UIManagerMediaFeaturesBranchingTest : public WithCommitBranching,
                                            public UIManagerMediaFeaturesTest {
};

// With commit branching, a React commit is put on screen by a later merge.
TEST_F(UIManagerMediaFeaturesBranchingTest, mergeKeepsAChangeBeforeIt) {
  auto view = createView();
  reactCommit(view);
  shadowTree_->promoteReactRevision();
  shadowTree_->mergeReactRevision();
  EXPECT_FLOAT_EQ(committedOpacity(), 1);

  // React commits its light view again, and the change comes before the merge.
  reactCommit(view);
  shadowTree_->promoteReactRevision();
  uiManager_->setMediaFeatures({.colorScheme = ColorScheme::Dark});
  EXPECT_FLOAT_EQ(committedOpacity(), 0.5);

  shadowTree_->mergeReactRevision();
  EXPECT_FLOAT_EQ(committedOpacity(), 0.5);
}

} // namespace facebook::react
