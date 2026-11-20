/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

#include <gtest/gtest.h>
#include <react/renderer/components/scrollview/ScrollContentViewComponentDescriptor.h>
#include <react/renderer/components/scrollview/ScrollContentViewState.h>
#include <react/renderer/components/view/ViewShadowNode.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/renderer/core/StateUpdate.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerDelegate.h>
#include <react/utils/OnScopeExit.h>

namespace facebook::react {

namespace {

class RecordingUIManagerDelegate : public UIManagerDelegate {
 public:
  std::vector<std::pair<SurfaceId, bool>> transactions;

  void uiManagerDidFinishTransaction(
      std::shared_ptr<const MountingCoordinator> mountingCoordinator,
      bool mountSynchronously) override {
    transactions.emplace_back(
        mountingCoordinator->getSurfaceId(), mountSynchronously);
  }

  void uiManagerDidCreateShadowNode(const ShadowNode& /*shadowNode*/) override {
  }
  void uiManagerDidDispatchCommand(
      const std::shared_ptr<const ShadowNode>& /*shadowNode*/,
      const std::string& /*commandName*/,
      const folly::dynamic& /*args*/) override {}
  void uiManagerDidSendAccessibilityEvent(
      const std::shared_ptr<const ShadowNode>& /*shadowNode*/,
      const std::string& /*eventType*/) override {}
  void uiManagerDidSetIsJSResponder(
      const std::shared_ptr<const ShadowNode>& /*shadowNode*/,
      bool /*isJSResponder*/,
      bool /*blockNativeResponder*/) override {}
  void uiManagerShouldSynchronouslyUpdateViewOnUIThread(
      Tag /*tag*/,
      const folly::dynamic& /*props*/) override {}
  void uiManagerShouldSynchronouslyUpdateAnimatedProps(
      const std::unordered_map<Tag, AnimatedProps>& /*updates*/) override {}
  void uiManagerDidUpdateShadowTree(
      const std::unordered_map<Tag, folly::dynamic>& /*tagToProps*/) override {}
  void uiManagerShouldAddEventListener(
      std::shared_ptr<const EventListener> /*listener*/) override {}
  void uiManagerShouldRemoveEventListener(
      const std::shared_ptr<const EventListener>& /*listener*/) override {}
  void uiManagerDidStartSurface(const ShadowTree& /*shadowTree*/) override {}
  void uiManagerDidFinishReactCommit(
      const ShadowTree& /*shadowTree*/) override {}
  void uiManagerShouldAddOnSurfaceStartCallback(
      OnSurfaceStartCallback&& /*callback*/) override {}
  void uiManagerDidCaptureViewSnapshot(Tag /*tag*/, SurfaceId /*surfaceId*/)
      override {}
  void uiManagerDidSetViewSnapshot(
      Tag /*sourceTag*/,
      Tag /*targetTag*/,
      SurfaceId /*surfaceId*/) override {}
  void uiManagerDidClearPendingSnapshots() override {}
};

} // namespace

class FabricUIManagerTest : public ::testing::Test {
 public:
  FabricUIManagerTest() {
    contextContainer_ = std::make_shared<ContextContainer>();

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
    componentDescriptorProviderRegistry.add(
        concreteComponentDescriptorProvider<
            ScrollContentViewComponentDescriptor>());

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
    uiManager_->stopSurface(surfaceId_);
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
            sharedProps->layoutConstraints = LayoutConstraints{
                .minimumSize = {.width = 0, .height = 0},
                .maximumSize = {.width = 500, .height = 500}};
            return sharedProps;
          })
          .children({
            Element<ViewShadowNode>()
              .tag(viewTag_)
              .surfaceId(surfaceId_)
              .props([] {
                auto sharedProps = std::make_shared<ViewShadowNodeProps>();
                sharedProps->nativeId = "initial";
                sharedProps->opacity = 1.0;
                return sharedProps;
              })
          });
    // clang-format on

    builder_->build(element);
    return rootNode;
  }

  void buildAndCommitTree() {
    auto rootNode = buildTree();

    auto shadowTree = std::make_unique<ShadowTree>(
        surfaceId_,
        LayoutConstraints{},
        LayoutContext{},
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

  std::shared_ptr<const ShadowNode> currentViewNode() const {
    auto root = shadowTreePtr_->getCurrentRevision().rootShadowNode;
    return root->getChildren().front();
  }

  const ViewProps& viewPropsInTree() const {
    return static_cast<const ViewProps&>(*currentViewNode()->getProps());
  }

  SurfaceId surfaceId_{0};
  Tag viewTag_{42};
  std::shared_ptr<ContextContainer> contextContainer_;
  std::unique_ptr<ComponentBuilder> builder_;
  std::unique_ptr<UIManager> uiManager_;
  ShadowTree* shadowTreePtr_{nullptr};
};

TEST_F(FabricUIManagerTest, NativeStateUpdateRequestsSynchronousMount) {
  auto contentNode = builder_->build(
      Element<ScrollContentViewShadowNode>().tag(viewTag_).surfaceId(
          surfaceId_));
  auto rootChildren =
      std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>();
  rootChildren->push_back(contentNode);
  uiManager_->completeSurface(surfaceId_, rootChildren, {});

  auto stateData = ScrollContentViewState{};
  stateData.safeAreaPadding.top = 20;
  stateData.safeAreaPadding.bottom = 12;
  auto expectedStateData =
      std::make_shared<const ScrollContentViewState>(stateData);
  ASSERT_NE(contentNode->getStateData(), stateData);

  RecordingUIManagerDelegate delegate;
  uiManager_->setDelegate(&delegate);
  auto resetDelegate = OnScopeExit([&]() { uiManager_->setDelegate(nullptr); });
  auto update = StateUpdate{
      .family = contentNode->getFamilyShared(),
      .callback = [expectedStateData](const StateData::Shared& /*oldData*/)
          -> StateData::Shared { return expectedStateData; }};

  uiManager_->updateState(update);

  const std::vector<std::pair<SurfaceId, bool>> expectedTransactions{
      {surfaceId_, true}};
  EXPECT_EQ(delegate.transactions, expectedTransactions);
  auto updatedNode =
      std::static_pointer_cast<const ScrollContentViewShadowNode>(
          currentViewNode());
  ASSERT_NE(updatedNode->getState(), nullptr);
  EXPECT_EQ(&updatedNode->getStateData(), expectedStateData.get());
  EXPECT_EQ(updatedNode->getStateData(), stateData);
}

// Demonstrates the merge between props set by `setNativeProps_DEPRECATED`
// (the legacy native-side prop override path) and props supplied by a
// regular React re-render via `cloneNode`. The native override must
// survive a React render that does not touch the overridden key, and
// other React-supplied keys must still apply.
TEST_F(FabricUIManagerTest, SetNativePropsMergesWithReactRender) {
  ASSERT_EQ(viewPropsInTree().nativeId, "initial");
  ASSERT_FLOAT_EQ(viewPropsInTree().opacity, 1.0);

  // Native override on `opacity` only. The committed tree picks up the new
  // opacity and leaves the unrelated `nativeId` untouched.
  uiManager_->setNativeProps_DEPRECATED(
      currentViewNode(), RawProps(folly::dynamic::object("opacity", 0.5)));
  EXPECT_EQ(viewPropsInTree().nativeId, "initial");
  EXPECT_FLOAT_EQ(viewPropsInTree().opacity, 0.5);

  // Simulate a React re-render that updates `nativeID` only. The native
  // `opacity` override must survive (it is not present in rawProps and
  // therefore not refreshed away by React), and the new `nativeID` must
  // apply on top.
  auto rerendered = uiManager_->cloneNode(
      *currentViewNode(),
      /*children=*/nullptr,
      RawProps(folly::dynamic::object("nativeID", "from-react")));
  auto& merged = static_cast<const ViewProps&>(*rerendered->getProps());
  EXPECT_EQ(merged.nativeId, "from-react");
  EXPECT_FLOAT_EQ(merged.opacity, 0.5);
}

// Cloning a node whose props already include the props set by
// `setNativeProps_DEPRECATED` (as Yoga does for every child of a node it lays
// out) keeps those props instead of parsing them again. Props set later are
// still applied.
TEST_F(FabricUIManagerTest, CloneAppliesSetNativePropsOnlyOnce) {
  uiManager_->setNativeProps_DEPRECATED(
      currentViewNode(), RawProps(folly::dynamic::object("opacity", 0.5)));

  auto first = currentViewNode()->clone({});
  EXPECT_FLOAT_EQ(
      static_cast<const ViewProps&>(*first->getProps()).opacity, 0.5);

  auto second = first->clone({});
  EXPECT_EQ(second->getProps(), first->getProps());

  uiManager_->setNativeProps_DEPRECATED(
      currentViewNode(), RawProps(folly::dynamic::object("opacity", 0.25)));
  auto third = second->clone({});
  EXPECT_NE(third->getProps(), second->getProps());
  EXPECT_FLOAT_EQ(
      static_cast<const ViewProps&>(*third->getProps()).opacity, 0.25);
}

// Another clone of a node whose props don't include the props set by
// `setNativeProps_DEPRECATED` still applies them, even after a clone of the
// same node already did.
TEST_F(FabricUIManagerTest, CloneAppliesSetNativePropsToEveryNodeWithoutThem) {
  auto original = currentViewNode();
  uiManager_->setNativeProps_DEPRECATED(
      original, RawProps(folly::dynamic::object("opacity", 0.5)));

  original->clone({});
  auto second = original->clone({});
  EXPECT_NE(second->getProps(), original->getProps());
  EXPECT_FLOAT_EQ(
      static_cast<const ViewProps&>(*second->getProps()).opacity, 0.5);
}

// After a React re-render replaces a node's props, the next clone applies the
// props set by `setNativeProps_DEPRECATED` again.
TEST_F(FabricUIManagerTest, CloneAppliesSetNativePropsAfterReactRender) {
  uiManager_->setNativeProps_DEPRECATED(
      currentViewNode(), RawProps(folly::dynamic::object("opacity", 0.5)));
  auto applied = currentViewNode()->clone({});

  auto rerendered = uiManager_->cloneNode(
      *applied,
      /*children=*/nullptr,
      RawProps(folly::dynamic::object("nativeID", "from-react")));
  auto cloned = rerendered->clone({});
  EXPECT_NE(cloned->getProps(), rerendered->getProps());
  auto& props = static_cast<const ViewProps&>(*cloned->getProps());
  EXPECT_EQ(props.nativeId, "from-react");
  EXPECT_FLOAT_EQ(props.opacity, 0.5);
}

} // namespace facebook::react
