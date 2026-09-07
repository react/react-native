/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/animationbackend/AnimationBackend.h>

#include <gtest/gtest.h>
#include <react/renderer/core/ComponentDescriptor.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerDelegate.h>
#include <react/utils/ContextContainer.h>

#include <memory>
#include <string>
#include <utility>
#include <vector>

namespace facebook::react {

namespace {

class TestAnimationChoreographer final : public AnimationChoreographer {
 public:
  void resume() override {
    ++resumeCount;
  }

  void pause() override {
    ++pauseCount;
  }

  AnimationTimestamp now() const override {
    return currentTimestamp;
  }

  int resumeCount{0};
  int pauseCount{0};
  AnimationTimestamp currentTimestamp{123.0};
};

class RecordingUIManagerDelegate final : public UIManagerDelegate {
 public:
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

  void uiManagerShouldSynchronouslyUpdateViewOnUIThread(
      Tag tag,
      const folly::dynamic& props) override {
    synchronousUpdates.push_back({tag, props});
  }

  void uiManagerDidUpdateShadowTree(
      const std::unordered_map<Tag, folly::dynamic>& /*tagToProps*/) override {}

  void uiManagerShouldAddEventListener(
      std::shared_ptr<const EventListener> /*listener*/) override {}

  void uiManagerShouldRemoveEventListener(
      const std::shared_ptr<const EventListener>& /*listener*/) override {}

  void uiManagerDidStartSurface(const ShadowTree& /*shadowTree*/) override {}

  void uiManagerDidFinishReactCommit(
      const ShadowTree& /*shadowTree*/) override {}

  void uiManagerDidPromoteReactRevision(
      const ShadowTree& /*shadowTree*/) override {}

  void uiManagerShouldAddOnSurfaceStartCallback(
      OnSurfaceStartCallback&& callback) override {
    surfaceStartCallbacks.push_back(std::move(callback));
  }

  void uiManagerDidCaptureViewSnapshot(Tag /*tag*/, SurfaceId /*surfaceId*/)
      override {}

  void uiManagerDidSetViewSnapshot(
      Tag /*sourceTag*/,
      Tag /*targetTag*/,
      SurfaceId /*surfaceId*/) override {}

  void uiManagerDidClearPendingSnapshots() override {}

  std::vector<std::pair<Tag, folly::dynamic>> synchronousUpdates;
  std::vector<OnSurfaceStartCallback> surfaceStartCallbacks;
};

class TestComponentDescriptor final : public ComponentDescriptor {
 public:
  explicit TestComponentDescriptor(
      const ComponentDescriptorParameters& parameters)
      : ComponentDescriptor(parameters) {}

  ComponentHandle getComponentHandle() const override {
    return ComponentHandle{1};
  }

  ComponentName getComponentName() const override {
    return "Test";
  }

  ShadowNodeTraits getTraits() const override {
    return ShadowNodeTraits{};
  }

  std::shared_ptr<ShadowNode> createShadowNode(
      const ShadowNodeFragment& /*fragment*/,
      const ShadowNodeFamily::Shared& /*family*/) const override {
    return nullptr;
  }

  std::shared_ptr<ShadowNode> cloneShadowNode(
      const ShadowNode& /*sourceShadowNode*/,
      const ShadowNodeFragment& /*fragment*/) const override {
    return nullptr;
  }

  void appendChild(
      const std::shared_ptr<const ShadowNode>& /*parentShadowNode*/,
      const std::shared_ptr<const ShadowNode>& /*childShadowNode*/)
      const override {}

  Props::Shared cloneProps(
      const PropsParserContext& /*context*/,
      const Props::Shared& /*props*/,
      RawProps /*rawProps*/) const override {
    return nullptr;
  }

  State::Shared createInitialState(
      const Props::Shared& /*props*/,
      const ShadowNodeFamily::Shared& /*family*/) const override {
    return nullptr;
  }

  State::Shared createState(
      const ShadowNodeFamily& /*family*/,
      const StateData::Shared& /*data*/) const override {
    return nullptr;
  }

  ShadowNodeFamily::Shared createFamily(
      const ShadowNodeFamilyFragment& fragment) const override {
    return std::make_shared<ShadowNodeFamily>(
        fragment, nullptr, EventDispatcher::Weak{}, *this);
  }

 private:
  void adopt(ShadowNode& /*shadowNode*/) const override {}
};

class AnimationBackendTest : public ::testing::Test {
 protected:
  AnimationBackendTest()
      : contextContainer_(std::make_shared<ContextContainer>()),
        componentDescriptor_(
            ComponentDescriptorParameters{
                .eventDispatcher = {},
                .contextContainer = contextContainer_,
                .flavor = nullptr}) {}

  void SetUp() override {
    RuntimeExecutor runtimeExecutor =
        [](std::function<void(facebook::jsi::Runtime & runtime)>&&
           /*callback*/) {};
    uiManager_ =
        std::make_shared<UIManager>(runtimeExecutor, contextContainer_);
    uiManager_->setDelegate(&uiManagerDelegate_);
    choreographer_ = std::make_shared<TestAnimationChoreographer>();
    animationBackend_ =
        std::make_unique<AnimationBackend>(choreographer_, uiManager_);
  }

  void TearDown() override {
    uiManager_->setDelegate(nullptr);
  }

  std::shared_ptr<const ShadowNodeFamily> createFamily(
      Tag tag,
      SurfaceId surfaceId) {
    return componentDescriptor_.createFamily(
        {.tag = tag, .surfaceId = surfaceId, .instanceHandle = nullptr});
  }

  static AnimatedProps makeAnimatedOpacity(Float opacity) {
    AnimatedProps props;
    props.props.push_back(
        std::make_unique<AnimatedProp<Float>>(PropName::OPACITY, opacity));
    return props;
  }

  std::shared_ptr<ContextContainer> contextContainer_;
  TestComponentDescriptor componentDescriptor_;
  RecordingUIManagerDelegate uiManagerDelegate_;
  std::shared_ptr<TestAnimationChoreographer> choreographer_;
  std::shared_ptr<UIManager> uiManager_;
  std::unique_ptr<AnimationBackend> animationBackend_;
};

TEST_F(AnimationBackendTest, testStartStopManageChoreographerState) {
  auto firstCallbackId = animationBackend_->start(
      [](AnimationTimestamp /*timestamp*/) { return AnimationMutations{}; });
  auto secondCallbackId = animationBackend_->start(
      [](AnimationTimestamp /*timestamp*/) { return AnimationMutations{}; });

  EXPECT_NE(firstCallbackId, secondCallbackId);
  EXPECT_EQ(choreographer_->resumeCount, 1);
  EXPECT_EQ(choreographer_->pauseCount, 0);

  animationBackend_->stop(firstCallbackId);

  EXPECT_EQ(choreographer_->resumeCount, 1);
  EXPECT_EQ(choreographer_->pauseCount, 0);

  animationBackend_->stop(secondCallbackId);

  EXPECT_EQ(choreographer_->resumeCount, 1);
  EXPECT_EQ(choreographer_->pauseCount, 1);
}

TEST_F(AnimationBackendTest, testOnAnimationFrameUsesCallbackSnapshot) {
  std::vector<std::string> callbackOrder;
  CallbackId secondCallbackId{};

  animationBackend_->start([&](AnimationTimestamp /*timestamp*/) {
    callbackOrder.push_back("first");
    animationBackend_->stop(secondCallbackId);
    return AnimationMutations{};
  });
  secondCallbackId =
      animationBackend_->start([&](AnimationTimestamp /*timestamp*/) {
        callbackOrder.push_back("second");
        return AnimationMutations{};
      });

  animationBackend_->onAnimationFrame(AnimationTimestamp{1.0});

  EXPECT_EQ(callbackOrder, (std::vector<std::string>{"first", "second"}));

  callbackOrder.clear();
  animationBackend_->onAnimationFrame(AnimationTimestamp{2.0});

  EXPECT_EQ(callbackOrder, (std::vector<std::string>{"first"}));
}

TEST_F(AnimationBackendTest, testPushAnimationMutationsForwardsPackedProps) {
  const auto surfaceId = SurfaceId{11};
  const auto tag = Tag{42};
  const auto expectedTimestamp = AnimationTimestamp{321.0};
  choreographer_->currentTimestamp = expectedTimestamp;
  auto family = createFamily(tag, surfaceId);
  AnimationTimestamp observedTimestamp{};

  animationBackend_->pushAnimationMutations([&](AnimationTimestamp timestamp) {
    observedTimestamp = timestamp;
    AnimationMutations mutations;
    mutations.batch.push_back(
        AnimationMutation{
            .tag = tag,
            .family = family,
            .props = makeAnimatedOpacity(0.25),
            .hasLayoutUpdates = false});
    return mutations;
  });

  ASSERT_EQ(observedTimestamp, expectedTimestamp);
  ASSERT_EQ(uiManagerDelegate_.synchronousUpdates.size(), 1);
  EXPECT_EQ(uiManagerDelegate_.synchronousUpdates[0].first, tag);
  EXPECT_EQ(
      uiManagerDelegate_.synchronousUpdates[0].second.at("opacity"), 0.25);
}

} // namespace

} // namespace facebook::react
