/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/animationbackend/AnimatedPropsBuilder.h>
#include <react/renderer/animationbackend/AnimationBackend.h>
#include <react/renderer/components/view/ViewShadowNode.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerDelegate.h>
#include <react/utils/ContextContainer.h>

namespace facebook::react {

namespace {

class TestAnimationChoreographer : public AnimationChoreographer {
 public:
  void resume() override {}
  void pause() override {}
};

class RecordingUIManagerDelegate : public UIManagerDelegate {
 public:
  std::unordered_map<Tag, folly::dynamic> synchronousUpdates;

  void uiManagerShouldSynchronouslyUpdateViewOnUIThread(
      Tag tag,
      const folly::dynamic& props) override {
    synchronousUpdates.emplace(tag, props);
  }

  void uiManagerShouldSynchronouslyUpdateAnimatedProps(
      const std::unordered_map<Tag, AnimatedProps>& /*updates*/) override {}
  void uiManagerDidFinishTransaction(
      std::shared_ptr<const MountingCoordinator> /*mountingCoordinator*/,
      bool /*mountSynchronously*/) override {}
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

class AnimationBackendTest : public ::testing::Test {
 protected:
  std::shared_ptr<ContextContainer> contextContainer =
      std::make_shared<ContextContainer>();
  ComponentBuilder builder = simpleComponentBuilder(contextContainer);
  std::shared_ptr<ViewShadowNode> node =
      builder.build(Element<ViewShadowNode>().surfaceId(1).tag(10));
  RecordingUIManagerDelegate delegate;
  std::shared_ptr<UIManager> uiManager = std::make_shared<UIManager>(
      [](std::function<void(jsi::Runtime&)>&& /*callback*/) {},
      contextContainer);
  std::shared_ptr<AnimationBackend> backend;

  void SetUp() override {
    uiManager->setDelegate(&delegate);
    backend = std::make_shared<AnimationBackend>(
        std::make_shared<TestAnimationChoreographer>(), uiManager);
  }

  void TearDown() override {
    backend.reset();
    uiManager->setDelegate(nullptr);
  }
};

TEST_F(AnimationBackendTest, layoutViewWritesNonLayoutPropsSynchronously) {
  backend->pushAnimationMutations([this](AnimationTimestamp /*timestamp*/) {
    AnimatedPropsBuilder propsBuilder;
    propsBuilder.setWidth(yoga::StyleSizeLength::points(100));
    propsBuilder.setOpacity(0.5);
    AnimationMutations mutations;
    mutations.batch.push_back(
        AnimationMutation{
            .tag = 10,
            .family = node->getFamilyShared(),
            .props = propsBuilder.get(),
            .hasLayoutUpdates = true});
    return mutations;
  });

  ASSERT_EQ(delegate.synchronousUpdates.size(), 1u);
  folly::dynamic expected = folly::dynamic::object("opacity", 0.5);
  EXPECT_EQ(delegate.synchronousUpdates.at(10), expected);
}

} // namespace facebook::react
