/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>
#include <react/renderer/components/view/ViewShadowNode.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>
#include <react/renderer/uimanager/UIManager.h>

namespace facebook::react {

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

} // namespace facebook::react
