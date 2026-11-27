/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AnimationTestsBase.h"

#include <react/renderer/animated/NativeAnimatedNodesManager.h>
#include <react/renderer/animationbackend/AnimationMutation.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>
#include <react/renderer/uimanager/UIManagerAnimationBackend.h>
#include <react/utils/ContextContainer.h>

namespace facebook::react {

namespace {

class RecordingAnimationBackend : public UIManagerAnimationBackend {
 public:
  std::vector<AnimationFrontend> frontends;
  std::vector<AnimationFrontendId> startedFrontends;
  int startedCallbacks{0};

  void onAnimationFrame(AnimationTimestamp /*timestamp*/) override {}
  AnimationFrontendId registerFrontend(AnimationFrontend frontend) override {
    frontends.push_back(std::move(frontend));
    return static_cast<AnimationFrontendId>(frontends.size());
  }
  void startFrontend(AnimationFrontendId frontendId) override {
    startedFrontends.push_back(frontendId);
  }
  void stopFrontend(AnimationFrontendId /*frontendId*/) override {}
  CallbackId start(const Callback& /*callback*/) override {
    startedCallbacks++;
    return 0;
  }
  void stop(CallbackId /*callbackId*/) override {}
  void clearRegistry(SurfaceId /*surfaceId*/) override {}
  void clearRegistryOnSurfaceStop(SurfaceId /*surfaceId*/) override {}
  void trigger() override {}
  void pushAnimationMutations(const Callback& /*callback*/) override {}
  void registerJSInvoker(std::shared_ptr<CallInvoker> /*jsInvoker*/) override {}
};

constexpr Tag kValueNode = 1;
constexpr Tag kStyleNode = 2;
constexpr Tag kPropsNode = 3;
constexpr Tag kView = 10;

} // namespace

class NativeAnimatedFrontendTests : public AnimationTestsBase {
 protected:
  void SetUp() override {
    runOnRenderThread();
  }

  // Starts animating the view's opacity in four frames.
  void startAnimation() {
    manager_ = std::make_shared<NativeAnimatedNodesManager>(backend_);
    manager_->createAnimatedNode(
        kValueNode,
        folly::dynamic::object("type", "value")("value", 0)("offset", 0));
    manager_->createAnimatedNode(
        kStyleNode,
        folly::dynamic::object("type", "style")(
            "style", folly::dynamic::object("opacity", kValueNode)));
    manager_->createAnimatedNode(
        kPropsNode,
        folly::dynamic::object("type", "props")(
            "props", folly::dynamic::object("style", kStyleNode)));
    manager_->connectAnimatedNodes(kValueNode, kStyleNode);
    manager_->connectAnimatedNodes(kStyleNode, kPropsNode);
    manager_->connectAnimatedNodeToView(kPropsNode, kView);
    manager_->connectAnimatedNodeToShadowNodeFamily(
        kPropsNode,
        std::const_pointer_cast<ShadowNodeFamily>(view_->getFamilyShared()));
    manager_->startAnimatingNode(
        1,
        kValueNode,
        folly::dynamic::object("type", "frames")(
            "frames", folly::dynamic::array(0.0, 0.5, 1.0))("toValue", 1),
        std::nullopt);
    manager_->startRenderCallbackIfNeeded(false);
  }

  std::shared_ptr<RecordingAnimationBackend> backend_ =
      std::make_shared<RecordingAnimationBackend>();
  std::shared_ptr<NativeAnimatedNodesManager> manager_;
  ComponentBuilder builder_ =
      simpleComponentBuilder(std::make_shared<ContextContainer>());
  std::shared_ptr<ViewShadowNode> view_ =
      builder_.build(Element<ViewShadowNode>().surfaceId(1).tag(kView));
};

TEST_F(NativeAnimatedFrontendTests, registersAndStartsAFrontend) {
  startAnimation();

  ASSERT_EQ(backend_->frontends.size(), 1u);
  EXPECT_EQ(backend_->startedFrontends, std::vector<AnimationFrontendId>{1});
  EXPECT_EQ(backend_->startedCallbacks, 0);
}

} // namespace facebook::react
