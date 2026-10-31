/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AnimationTestsBase.h"

#include <react/renderer/animated/drivers/AnimationDriverUtils.h>
#include <react/renderer/components/scrollview/ScrollEvent.h>
#include <react/renderer/core/ReactRootViewTagGenerator.h>

namespace facebook::react {

namespace {

// Runs event-driven updates at a timestamp the test sets, like a platform
// whose current time is later than the vsync time of the next frame.
class FakeAnimationBackend : public UIManagerAnimationBackend {
 public:
  AnimationTimestamp pushTimestamp{0};

  void onAnimationFrame(AnimationTimestamp /*timestamp*/) override {}
  CallbackId start(const Callback& /*callback*/) override {
    return 0;
  }
  void stop(CallbackId /*callbackId*/) override {}
  void clearRegistry(SurfaceId /*surfaceId*/) override {}
  void clearRegistryOnSurfaceStop(SurfaceId /*surfaceId*/) override {}
  void trigger() override {}
  void pushAnimationMutations(const Callback& callback) override {
    callback(pushTimestamp);
  }
  void registerJSInvoker(std::shared_ptr<CallInvoker> /*jsInvoker*/) override {}
};

} // namespace

class EventAnimationDriverTests : public AnimationTestsBase {
 protected:
  static constexpr double kStartTime = 1000;

  std::shared_ptr<FakeAnimationBackend> backend_ =
      std::make_shared<FakeAnimationBackend>();
  Tag tag_{getNextRootViewTag()};
  Tag viewTag_{++tag_};
  Tag scrollValueTag_{++tag_};
  Tag animatedValueTag_{++tag_};

  // A shared-backend manager with a scroll event mapped to scrollValueTag_ and
  // the given animation running on animatedValueTag_.
  void startSharedBackendAnimation(const folly::dynamic& animationConfig) {
    // Marks this thread as the render thread.
    initNodesManager();
    nodesManager_ = std::make_shared<NativeAnimatedNodesManager>(backend_);

    const folly::dynamic valueNodeConfig =
        folly::dynamic::object("type", "value")("value", 0)("offset", 0);
    nodesManager_->createAnimatedNode(scrollValueTag_, valueNodeConfig);
    nodesManager_->addAnimatedEventToView(
        viewTag_,
        "scroll",
        folly::dynamic::object("animatedValueTag", scrollValueTag_)(
            "nativeEventPath", folly::dynamic::array("contentOffset", "y")));
    nodesManager_->createAnimatedNode(animatedValueTag_, valueNodeConfig);
    nodesManager_->startAnimatingNode(
        1, animatedValueTag_, animationConfig, std::nullopt);
  }

  void runBackendFrame(double timestamp) {
    nodesManager_->pullAnimationMutations(AnimationTimestamp{timestamp});
  }

  void dispatchScrollAt(double timestamp, double offsetY) {
    backend_->pushTimestamp = AnimationTimestamp{timestamp};
    auto scrollEvent = std::make_shared<ScrollEvent>();
    scrollEvent->contentOffset = {.x = 0, .y = static_cast<Float>(offsetY)};
    (*nodesManager_->getEventEmitterListener())(
        viewTag_, "scroll", *scrollEvent);
  }

  double animatedValue() {
    return nodesManager_->getValue(animatedValueTag_).value();
  }
};

TEST_F(EventAnimationDriverTests, subscribeToViewEvent) {
  initNodesManager();

  auto tag = getNextRootViewTag();

  auto viewTag = ++tag;
  const auto animatedValueTag = ++tag;
  const auto animatedValueTag2 = ++tag;

  const auto eventName = "scroll";

  const folly::dynamic valueNodeConfig =
      folly::dynamic::object("type", "value")("value", 0)("offset", 0);

  // Call onRender once to initialize thread local
  nodesManager_->onRender();

  {
    nodesManager_->createAnimatedNode(animatedValueTag, valueNodeConfig);

    folly::dynamic eventMapping =
        folly::dynamic::object("animatedValueTag", animatedValueTag)(
            "nativeEventPath", folly::dynamic::array("contentOffset", "y"));
    nodesManager_->addAnimatedEventToView(viewTag, eventName, eventMapping);
  }

  {
    nodesManager_->createAnimatedNode(animatedValueTag2, valueNodeConfig);

    folly::dynamic eventMapping =
        folly::dynamic::object("animatedValueTag", animatedValueTag2)(
            "nativeEventPath", folly::dynamic::array("zoomScale"));
    nodesManager_->addAnimatedEventToView(viewTag, eventName, eventMapping);
  }

  EXPECT_EQ(nodesManager_->getValue(animatedValueTag), 0);
  EXPECT_EQ(nodesManager_->getValue(animatedValueTag2), 0);

  auto scrollEvent = std::make_shared<ScrollEvent>();
  scrollEvent->contentSize = {.width = 1, .height = 2};
  scrollEvent->contentOffset = {.x = 3, .y = 4};
  scrollEvent->contentInset = {.left = 5, .top = 6, .right = 7, .bottom = 8};
  scrollEvent->containerSize = {.width = 9, .height = 10};
  scrollEvent->zoomScale = 11.0f;

  const std::string eventType{eventName};
  const SharedEventPayload payload = scrollEvent;
  (*nodesManager_->getEventEmitterListener())(viewTag, eventName, *scrollEvent);

  EXPECT_EQ(nodesManager_->getValue(animatedValueTag), 4);
  EXPECT_EQ(nodesManager_->getValue(animatedValueTag2), 11);
}

TEST_F(
    EventAnimationDriverTests,
    sharedBackendEventDoesNotStepTimingAnimationAheadOfFrames) {
  startSharedBackendAnimation(
      folly::dynamic::object("type", "frames")(
          "frames", folly::dynamic::array(0.0, 0.25, 0.5, 0.75, 1.0))(
          "toValue", 100));

  runBackendFrame(kStartTime);
  runBackendFrame(kStartTime + SingleFrameIntervalMs);
  const auto valueBeforeEvent = animatedValue();
  EXPECT_GT(valueBeforeEvent, 0);

  // The event is handled later than the next frame's vsync time.
  dispatchScrollAt(kStartTime + SingleFrameIntervalMs * 3, 4);
  EXPECT_EQ(nodesManager_->getValue(scrollValueTag_), 4);
  EXPECT_EQ(animatedValue(), valueBeforeEvent);

  runBackendFrame(kStartTime + SingleFrameIntervalMs * 2);
  EXPECT_GT(animatedValue(), valueBeforeEvent);
}

TEST_F(EventAnimationDriverTests, sharedBackendEventDoesNotEndDecayAnimation) {
  startSharedBackendAnimation(
      folly::dynamic::object("type", "decay")("velocity", 1.0)(
          "deceleration", 0.998)("iterations", 1));

  runBackendFrame(kStartTime);
  runBackendFrame(kStartTime + SingleFrameIntervalMs);
  dispatchScrollAt(kStartTime + SingleFrameIntervalMs * 2, 4);
  runBackendFrame(kStartTime + SingleFrameIntervalMs * 2);
  const auto valueAfterEvent = animatedValue();

  runBackendFrame(kStartTime + SingleFrameIntervalMs * 3);
  EXPECT_GT(animatedValue(), valueAfterEvent);
}

} // namespace facebook::react
