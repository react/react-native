/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
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

// Runs JS tasks when asked.
class TestCallInvoker : public CallInvoker {
 public:
  std::vector<std::function<void()>> tasks;

  void invokeAsync(CallFunc&& /*func*/) noexcept override {}
  void invokeAsync(std::function<void()>&& func) noexcept override {
    tasks.push_back(std::move(func));
  }
  void invokeSync(CallFunc&& /*func*/) override {}

  void runTasks() {
    for (auto& task : std::exchange(tasks, {})) {
      task();
    }
  }
};

class DirectPathFlags : public ReactNativeFeatureFlagsDefaults {
 public:
  bool enableCxxAnimatedDirectPathInBackend() override {
    return true;
  }
};

} // namespace

// A view on a running surface whose React opacity is 0.8.
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
  ShadowTree* shadowTree{nullptr};
  std::shared_ptr<TestAnimationChoreographer> choreographer =
      std::make_shared<TestAnimationChoreographer>();
  std::shared_ptr<AnimationBackend> backend;
  std::shared_ptr<TestCallInvoker> jsInvoker =
      std::make_shared<TestCallInvoker>();
  double frameTime{1000};

  void SetUp() override {
    uiManager->setDelegate(&delegate);
    view = builder.build(
        Element<ViewShadowNode>().tag(kView).surfaceId(kSurface).props([] {
          auto props = std::make_shared<ViewProps>();
          props->opacity = 0.8;
          return props;
        }));
    auto tree = std::make_unique<ShadowTree>(
        kSurface,
        LayoutConstraints{},
        LayoutContext{},
        *uiManager,
        *contextContainer);
    shadowTree = tree.get();
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
    backend->registerJSInvoker(jsInvoker);
  }

  void TearDown() override {
    backend.reset();
    uiManager->stopSurface(kSurface);
    uiManager->setDelegate(nullptr);
    ReactNativeFeatureFlags::dangerouslyReset();
  }

  AnimationMutations opacity(double value, bool finishesAnimation = false)
      const {
    return rawProps(
        folly::dynamic::object("opacity", value), finishesAnimation);
  }

  AnimationMutations rawProps(folly::dynamic values, bool finishesAnimation)
      const {
    AnimationMutations mutations;
    if (finishesAnimation) {
      mutations.asyncFlushSurfaces.insert(kSurface);
    }
    mutations.batch.push_back(
        AnimationMutation{
            .tag = kView,
            .family = view->getFamilyShared(),
            .props =
                {.props = {},
                 .rawProps = std::make_unique<RawProps>(std::move(values))},
            .finishesAnimation = finishesAnimation});
    return mutations;
  }

  void frame() {
    backend->onAnimationFrame(AnimationTimestamp{frameTime += 17});
  }

  static void enableDirectPath() {
    ReactNativeFeatureFlags::dangerouslyForceOverride(
        std::make_unique<DirectPathFlags>());
  }

  // A React commit of the view, by default changing another prop.
  void reactCommit(
      const folly::dynamic& rawProps =
          folly::dynamic::object("nativeID", "react")) {
    shadowTree->commit(
        [&](const RootShadowNode& oldRootShadowNode) {
          return std::static_pointer_cast<RootShadowNode>(
              oldRootShadowNode.cloneTree(
                  view->getFamily(), [&](const ShadowNode& oldShadowNode) {
                    PropsParserContext context{kSurface, *contextContainer};
                    return oldShadowNode.clone(
                        {.props =
                             oldShadowNode.getComponentDescriptor().cloneProps(
                                 context,
                                 oldShadowNode.getProps(),
                                 RawProps(rawProps))});
                  }));
        },
        {.source = ShadowTreeCommitSource::React});
  }

  Float committedOpacity() const {
    const auto& child =
        shadowTree->getCurrentRevision().rootShadowNode->getChildren().at(0);
    return static_cast<const ViewProps&>(*child->getProps()).opacity;
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

TEST_F(AnimationBackendFrontendTest, aCommittingFrontendsValueIsStamped) {
  auto frontendId = backend->registerFrontend({.commitDirectProps = true});
  backend->pushAnimationMutations(
      frontendId, [&](AnimationTimestamp) { return opacity(0.5); });

  reactCommit();

  EXPECT_FLOAT_EQ(committedOpacity(), 0.5);
}

TEST_F(AnimationBackendFrontendTest, anUncommittedFrontendsValueIsNotStamped) {
  enableDirectPath();
  auto frontendId = backend->registerFrontend({.commitDirectProps = false});
  backend->pushAnimationMutations(
      frontendId, [&](AnimationTimestamp) { return opacity(0.5); });

  reactCommit();

  EXPECT_FLOAT_EQ(
      delegate.synchronousUpdates.at(kView)["opacity"].asDouble(), 0.5);
  EXPECT_FLOAT_EQ(committedOpacity(), 0.8);
}

TEST_F(
    AnimationBackendFrontendTest,
    anUncommittedFrontendsFinalValueIsWrittenByTheEndOfAnimationCommit) {
  enableDirectPath();
  auto frontendId = backend->registerFrontend({.commitDirectProps = false});
  backend->pushAnimationMutations(
      frontendId, [&](AnimationTimestamp) { return opacity(0.5); });
  backend->pushAnimationMutations(frontendId, [&](AnimationTimestamp) {
    return opacity(0.2, /* finishesAnimation */ true);
  });

  reactCommit();
  EXPECT_FLOAT_EQ(committedOpacity(), 0.8);

  jsInvoker->runTasks();
  EXPECT_FLOAT_EQ(committedOpacity(), 0.2);
}

TEST_F(
    AnimationBackendFrontendTest,
    aFinalValueIsNotWrittenAgainAfterTheEndOfAnimationCommit) {
  enableDirectPath();
  auto frontendId = backend->registerFrontend({.commitDirectProps = false});
  backend->pushAnimationMutations(frontendId, [&](AnimationTimestamp) {
    return opacity(0.2, /* finishesAnimation */ true);
  });
  jsInvoker->runTasks();

  reactCommit(folly::dynamic::object("opacity", 0.6));
  backend->pushAnimationMutations(frontendId, [&](AnimationTimestamp) {
    return rawProps(
        folly::dynamic::object("nativeID", "animated"),
        /* finishesAnimation */ true);
  });
  jsInvoker->runTasks();

  EXPECT_FLOAT_EQ(committedOpacity(), 0.6);
}

TEST_F(
    AnimationBackendFrontendTest,
    aFinalValueIsNotOverwrittenByAnOlderStampedOne) {
  enableDirectPath();
  backend->pushAnimationMutations(
      [&](AnimationTimestamp) { return opacity(0.5); });
  reactCommit();
  auto frontendId = backend->registerFrontend({.commitDirectProps = false});
  backend->pushAnimationMutations(frontendId, [&](AnimationTimestamp) {
    return opacity(0.2, /* finishesAnimation */ true);
  });

  jsInvoker->runTasks();
  EXPECT_FLOAT_EQ(committedOpacity(), 0.2);
  reactCommit();
  EXPECT_FLOAT_EQ(committedOpacity(), 0.2);
}

TEST_F(AnimationBackendFrontendTest, anUncommittedFrontendsFrameIsNotStamped) {
  enableDirectPath();
  auto frontendId = backend->registerFrontend(
      {.commitDirectProps = false,
       .onAnimationFrame = [&](AnimationTimestamp) { return opacity(0.5); }});
  backend->startFrontend(frontendId);
  frame();
  backend->stopFrontend(frontendId);

  reactCommit();

  EXPECT_FLOAT_EQ(committedOpacity(), 0.8);
}

TEST_F(AnimationBackendFrontendTest, eachFinishingUpdateRequestsAFlush) {
  auto frontendId = backend->registerFrontend({});
  for (double value : {0.5, 0.2}) {
    backend->pushAnimationMutations(frontendId, [&](AnimationTimestamp) {
      return opacity(value, /* finishesAnimation */ true);
    });
  }

  EXPECT_EQ(jsInvoker->tasks.size(), 2);
}

TEST_F(
    AnimationBackendFrontendTest,
    oneFlushPerSurfaceIsScheduledWithTheDirectPath) {
  enableDirectPath();
  auto frontendId = backend->registerFrontend({.commitDirectProps = false});
  for (double value : {0.5, 0.2}) {
    backend->pushAnimationMutations(frontendId, [&](AnimationTimestamp) {
      return opacity(value, /* finishesAnimation */ true);
    });
  }

  EXPECT_EQ(jsInvoker->tasks.size(), 1);
  jsInvoker->runTasks();
  EXPECT_FLOAT_EQ(committedOpacity(), 0.2);

  backend->pushAnimationMutations(frontendId, [&](AnimationTimestamp) {
    return opacity(0.4, /* finishesAnimation */ true);
  });
  EXPECT_EQ(jsInvoker->tasks.size(), 1);
  jsInvoker->runTasks();
  EXPECT_FLOAT_EQ(committedOpacity(), 0.4);
}

} // namespace facebook::react
