/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/animationbackend/AnimationBackend.h>
#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/components/view/ViewShadowNode.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>
#include <react/renderer/mounting/ShadowTree.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerDelegate.h>
#include <react/utils/ContextContainer.h>

namespace facebook::react {

namespace {

constexpr SurfaceId kSurface = 1;
constexpr Tag kView = 10;

class TestAnimationChoreographer : public AnimationChoreographer {
 public:
  bool isResumed{false};

  void resume() override {
    isResumed = true;
  }
  void pause() override {
    isResumed = false;
  }
};

class RecordingUIManagerDelegate : public UIManagerDelegate {
 public:
  std::unordered_map<Tag, folly::dynamic> synchronousUpdates;

  void uiManagerShouldSynchronouslyUpdateViewOnUIThread(
      Tag tag,
      const folly::dynamic& props) override {
    synchronousUpdates.insert_or_assign(tag, props);
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

// A view on a running surface.
class AnimationBackendFrontendTest : public ::testing::Test {
 protected:
  std::shared_ptr<ContextContainer> contextContainer =
      std::make_shared<ContextContainer>();
  ComponentBuilder builder = simpleComponentBuilder(contextContainer);
  RecordingUIManagerDelegate delegate;
  std::shared_ptr<UIManager> uiManager = std::make_shared<UIManager>(
      [](std::function<void(jsi::Runtime&)>&& /*callback*/) {},
      contextContainer);
  std::shared_ptr<ViewShadowNode> view;
  std::shared_ptr<TestAnimationChoreographer> choreographer =
      std::make_shared<TestAnimationChoreographer>();
  std::shared_ptr<AnimationBackend> backend;
  double frameTime{1000};

  void SetUp() override {
    uiManager->setDelegate(&delegate);
    view =
        builder.build(Element<ViewShadowNode>().tag(kView).surfaceId(kSurface));
    auto tree = std::make_unique<ShadowTree>(
        kSurface,
        LayoutConstraints{},
        LayoutContext{},
        *uiManager,
        *contextContainer);
    tree->commit(
        [&](const RootShadowNode& oldRootShadowNode) {
          return std::static_pointer_cast<RootShadowNode>(
              oldRootShadowNode.ShadowNode::clone(
                  {.children = std::make_shared<
                       std::vector<std::shared_ptr<const ShadowNode>>>(
                       std::vector<std::shared_ptr<const ShadowNode>>{view})}));
        },
        {});
    uiManager->startSurface(
        std::move(tree), "test", folly::dynamic::object, DisplayMode::Visible);
    backend = std::make_shared<AnimationBackend>(choreographer, uiManager);
  }

  void TearDown() override {
    backend.reset();
    uiManager->stopSurface(kSurface);
    uiManager->setDelegate(nullptr);
  }

  AnimationMutations opacity(double value) const {
    AnimationMutations mutations;
    mutations.batch.push_back(
        AnimationMutation{
            .tag = kView,
            .family = view->getFamilyShared(),
            .props = {
                .props = {},
                .rawProps = std::make_unique<RawProps>(
                    folly::dynamic::object("opacity", value))}});
    return mutations;
  }

  void frame() {
    backend->onAnimationFrame(AnimationTimestamp{frameTime += 17});
  }
};

TEST_F(AnimationBackendFrontendTest, aStartedFrontendRunsOncePerFrame) {
  int frames = 0;
  auto frontendId =
      backend->registerFrontend({.onAnimationFrame = [&](AnimationTimestamp) {
        frames++;
        return AnimationMutations{};
      }});
  backend->startFrontend(frontendId);
  backend->startFrontend(frontendId);
  frame();
  EXPECT_EQ(frames, 1);

  backend->stopFrontend(frontendId);
  backend->stopFrontend(frontendId);
  frame();
  EXPECT_EQ(frames, 1);

  backend->startFrontend(frontendId);
  frame();
  EXPECT_EQ(frames, 2);
}

TEST_F(AnimationBackendFrontendTest, framesComeWhileAFrontendIsStarted) {
  auto idle = [](AnimationTimestamp) { return AnimationMutations{}; };
  auto first = backend->registerFrontend({.onAnimationFrame = idle});
  auto second = backend->registerFrontend({.onAnimationFrame = idle});
  backend->startFrontend(first);
  backend->startFrontend(second);
  EXPECT_TRUE(choreographer->isResumed);
  backend->stopFrontend(first);
  EXPECT_TRUE(choreographer->isResumed);
  backend->stopFrontend(second);
  EXPECT_FALSE(choreographer->isResumed);

  auto callbackId = backend->start(idle);
  backend->startFrontend(first);
  backend->stopFrontend(first);
  EXPECT_TRUE(choreographer->isResumed);
  backend->stop(callbackId);
  EXPECT_FALSE(choreographer->isResumed);
}

TEST_F(
    AnimationBackendFrontendTest,
    aFrontendWithoutAFrameCallbackIsNotStarted) {
  auto frontendId = backend->registerFrontend({});
  backend->startFrontend(frontendId);
  EXPECT_FALSE(choreographer->isResumed);
  frame();
}

TEST_F(AnimationBackendFrontendTest, framesRunInRegistrationOrder) {
  auto first = backend->registerFrontend(
      {.onAnimationFrame = [&](AnimationTimestamp) { return opacity(0.3); }});
  auto second = backend->registerFrontend(
      {.onAnimationFrame = [&](AnimationTimestamp) { return opacity(0.5); }});
  backend->startFrontend(second);
  backend->startFrontend(first);
  auto legacy =
      backend->start([&](AnimationTimestamp) { return opacity(0.7); });
  frame();
  backend->stop(legacy);

  EXPECT_EQ(delegate.synchronousUpdates.at(kView)["opacity"], 0.5);
}

} // namespace facebook::react
