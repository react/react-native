/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FabricMountingManagerTestHelper.h"

#include <react/fabric/FabricUIManagerBinding.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#include <react/renderer/animationbackend/AnimatedProps.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/ComponentDescriptor.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/mounting/MountingOverrideDelegate.h>
#include <react/renderer/mounting/MountingTransaction.h>
#include <react/renderer/mounting/ShadowView.h>
#include <react/renderer/scheduler/Scheduler.h>
#include <react/renderer/telemetry/TransactionTelemetry.h>

namespace facebook::react {

static LayoutConstraints makeLayoutConstraints(
    jfloat widthDp,
    jfloat heightDp) {
  Size size{.width = widthDp, .height = heightDp};
  return LayoutConstraints{
      .minimumSize = size,
      .maximumSize = size,
      .layoutDirection = LayoutDirection::LeftToRight};
}

class FabricMountingManagerTestHelper::DeleteRecorder
    : public MountingOverrideDelegate {
 public:
  bool shouldOverridePullTransaction() const override {
    return true;
  }

  std::optional<MountingTransaction> pullTransaction(
      SurfaceId surfaceId,
      MountingTransaction::Number number,
      const TransactionTelemetry& telemetry,
      ShadowViewMutationList mutations) const override {
    for (const auto& mutation : mutations) {
      if (mutation.type == ShadowViewMutation::Delete) {
        deletedTags.push_back(mutation.oldChildShadowView.tag);
      }
    }
    return MountingTransaction{
        surfaceId, number, std::move(mutations), telemetry};
  }

  mutable std::vector<Tag> deletedTags;
};

namespace {

ShadowView makeShadowView(jint surfaceId, jint tag) {
  ShadowView sv{};
  sv.componentName = "View";
  sv.surfaceId = surfaceId;
  sv.tag = tag;
  sv.props = std::make_shared<const ViewProps>();
  sv.layoutMetrics.frame.size = {.width = 100, .height = 100};
  return sv;
}

void runNoJavaScript(std::function<void(jsi::Runtime& runtime)>&& /*unused*/) {}

std::vector<Tag> toTags(jni::alias_ref<jni::JArrayInt> tags) {
  auto region = tags->getRegion(0, static_cast<jsize>(tags->size()));
  return {region.get(), region.get() + tags->size()};
}

} // namespace

FabricMountingManagerTestHelper::FabricMountingManagerTestHelper(
    jni::alias_ref<JFabricUIManager::javaobject> jFabricUIManager)
    : javaUIManager_(jni::make_global(jFabricUIManager)) {
  mountingManager_ = std::make_shared<FabricMountingManager>(javaUIManager_);

  contextContainer_ = std::make_shared<ContextContainer>();
  auto params = ComponentDescriptorParameters{
      .eventDispatcher = EventDispatcher::Shared{},
      .contextContainer = contextContainer_,
      .flavor = nullptr};
  viewComponentDescriptor_ = std::make_unique<ViewComponentDescriptor>(params);

  class TestShadowTreeDelegate : public ShadowTreeDelegate {
   public:
    RootShadowNode::Unshared shadowTreeWillCommit(
        [[maybe_unused]] const ShadowTree& shadowTree,
        [[maybe_unused]] const RootShadowNode::Shared& oldRootShadowNode,
        const RootShadowNode::Unshared& newRootShadowNode,
        [[maybe_unused]] const ShadowTreeCommitOptions& commitOptions)
        const override {
      return newRootShadowNode;
    }

    void shadowTreeDidFinishTransaction(
        [[maybe_unused]] std::shared_ptr<const MountingCoordinator>
            mountingCoordinator,
        [[maybe_unused]] bool mountSynchronously) const override {}

    void shadowTreeDidFinishReactCommit(
        [[maybe_unused]] const ShadowTree& shadowTree) const override {}
  };
  shadowTreeDelegate_ = std::make_unique<TestShadowTreeDelegate>();
}

void FabricMountingManagerTestHelper::initHybrid(
    jni::alias_ref<jhybridobject> jobj,
    jni::alias_ref<JFabricUIManager::javaobject> jFabricUIManager) {
  setCxxInstance(jobj, jFabricUIManager);
}

void FabricMountingManagerTestHelper::startSurface(jint surfaceId) {
  mountingManager_->onSurfaceStart(surfaceId);
}

void FabricMountingManagerTestHelper::stopSurface(jint surfaceId) {
  mountingManager_->onSurfaceStop(surfaceId);
}

void FabricMountingManagerTestHelper::preallocateView(
    jint surfaceId,
    jint tag) {
  queuePreallocation(surfaceId, tag);
  drainPreallocationQueue();
}

void FabricMountingManagerTestHelper::queuePreallocation(
    jint surfaceId,
    jint tag) {
  auto props = std::make_shared<ViewProps>();
  props->collapsable = false;
  auto shadowNode = viewComponentDescriptor_->createShadowNode(
      {.props = props},
      viewComponentDescriptor_->createFamily(
          {.tag = tag, .surfaceId = surfaceId, .instanceHandle = nullptr}));
  mountingManager_->maybePreallocateShadowNode(*shadowNode);
  queuedShadowNodes_[tag] = std::move(shadowNode);
}

void FabricMountingManagerTestHelper::drainPreallocationQueue() {
  mountingManager_->drainPreallocateViewsQueue();
}

void FabricMountingManagerTestHelper::executeCreateMutation(
    jint surfaceId,
    jint tag) {
  auto telemetry = TransactionTelemetry{};
  telemetry.willCommit();
  telemetry.willDiff();
  telemetry.didDiff();
  telemetry.willLayout();
  telemetry.didLayout();
  telemetry.didCommit();
  mountingManager_->executeMount(
      MountingTransaction{
          surfaceId,
          0,
          {ShadowViewMutation::CreateMutation(makeShadowView(surfaceId, tag))},
          telemetry});
}

void FabricMountingManagerTestHelper::dropFamily(jint tag) {
  queuedShadowNodes_.erase(tag);
}

void FabricMountingManagerTestHelper::destroyUnmountedView(
    jint surfaceId,
    jint tag) {
  auto family = viewComponentDescriptor_->createFamily(
      {.tag = tag, .surfaceId = surfaceId, .instanceHandle = nullptr});
  mountingManager_->destroyUnmountedShadowNode(*family);
}

void FabricMountingManagerTestHelper::destroyCommittedView(
    jint surfaceId,
    jint tag) {
  auto family = viewComponentDescriptor_->createFamily(
      {.tag = tag, .surfaceId = surfaceId, .instanceHandle = nullptr});
  family->onFamilyDestroyed([mountingManager = mountingManager_](
                                const ShadowNodeFamily& destroyedFamily) {
    mountingManager->destroyUnmountedShadowNode(destroyedFamily);
  });
  family->setMounted();
}

bool FabricMountingManagerTestHelper::isTagAllocated(jint surfaceId, jint tag) {
  return mountingManager_->isViewAllocated(surfaceId, tag);
}

void FabricMountingManagerTestHelper::synchronouslyUpdateAnimatedProps(
    jni::alias_ref<jni::JArrayInt> tags,
    jni::alias_ref<jni::JArrayClass<NativeMap::javaobject>> props) {
  auto tagValues = tags->getRegion(0, static_cast<jsize>(tags->size()));
  std::unordered_map<Tag, AnimatedProps> updates;
  for (size_t i = 0; i < tags->size(); i++) {
    updates.emplace(
        tagValues[i],
        AnimatedProps{
            .props = {},
            .rawProps = std::make_unique<RawProps>(
                props->getElement(i)->cthis()->consume())});
  }
  mountingManager_->synchronouslyUpdateAnimatedProps(updates);
}

void FabricMountingManagerTestHelper::startSurfaceWithConstraints(
    jint surfaceId,
    jfloat widthDp,
    jfloat heightDp,
    jfloat pointScaleFactor) {
  shadowTree_ = std::make_unique<ShadowTree>(
      surfaceId,
      makeLayoutConstraints(widthDp, heightDp),
      LayoutContext{.pointScaleFactor = pointScaleFactor},
      *shadowTreeDelegate_,
      *contextContainer_);
  mountingManager_->onSurfaceStart(surfaceId);
}

void FabricMountingManagerTestHelper::mountViewWithPadding(
    jint surfaceId,
    jint tag,
    jfloat padding) {
  using ShadowNodeList = std::vector<std::shared_ptr<const ShadowNode>>;
  PropsParserContext parserContext{surfaceId, *contextContainer_};
  auto createView = [&](Tag viewTag,
                        folly::dynamic style,
                        ShadowNodeList children) {
    auto family = viewComponentDescriptor_->createFamily(
        {.tag = viewTag, .surfaceId = surfaceId, .instanceHandle = nullptr});
    auto props = viewComponentDescriptor_->cloneProps(
        parserContext, nullptr, RawProps(std::move(style)));
    return viewComponentDescriptor_->createShadowNode(
        {.props = props,
         .children =
             std::make_shared<const ShadowNodeList>(std::move(children)),
         .state = viewComponentDescriptor_->createInitialState(props, family)},
        family);
  };

  auto overflowingChild = createView(
      tag + 1,
      folly::dynamic::object("collapsable", false)("position", "absolute")(
          "left", -padding)("top", -padding)("width", 100 + 2 * padding)(
          "height", 100 + 2 * padding),
      {});
  auto paddedView = createView(
      tag,
      folly::dynamic::object("collapsable", false)("width", 100)("height", 100)(
          "padding", padding),
      {overflowingChild});

  shadowTree_->commit(
      [&](const RootShadowNode& oldRootShadowNode) {
        return std::static_pointer_cast<RootShadowNode>(
            oldRootShadowNode.ShadowNode::clone(
                {.children = std::make_shared<const ShadowNodeList>(
                     ShadowNodeList{paddedView})}));
      },
      {});
  mountPendingTransaction();
}

void FabricMountingManagerTestHelper::updateSurfaceConstraints(
    jint surfaceId,
    jfloat widthDp,
    jfloat heightDp,
    jfloat pointScaleFactor) {
  PropsParserContext parserContext{surfaceId, *contextContainer_};
  shadowTree_->commit(
      [&](const RootShadowNode& oldRootShadowNode) {
        return oldRootShadowNode.clone(
            parserContext,
            makeLayoutConstraints(widthDp, heightDp),
            LayoutContext{.pointScaleFactor = pointScaleFactor});
      },
      {});
  mountPendingTransaction();
}

void FabricMountingManagerTestHelper::overrideFeatureFlags(
    jboolean fixTextLayoutOnPixelDensityChange) {
  class TestFeatureFlags : public ReactNativeFeatureFlagsDefaults {
   public:
    explicit TestFeatureFlags(bool fixTextLayoutOnPixelDensityChange)
        : fixTextLayoutOnPixelDensityChange_(
              fixTextLayoutOnPixelDensityChange) {}

    bool fixTextLayoutOnPixelDensityChange() override {
      return fixTextLayoutOnPixelDensityChange_;
    }

   private:
    bool fixTextLayoutOnPixelDensityChange_;
  };
  ReactNativeFeatureFlags::dangerouslyForceOverride(
      std::make_unique<TestFeatureFlags>(
          fixTextLayoutOnPixelDensityChange != 0));
}

void FabricMountingManagerTestHelper::resetFeatureFlags() {
  ReactNativeFeatureFlags::dangerouslyReset();
}

void FabricMountingManagerTestHelper::mountPendingTransaction() {
  auto transaction = shadowTree_->getMountingCoordinator()->pullTransaction();
  if (transaction.has_value()) {
    mountingManager_->executeMount(*transaction);
  }
}

jni::local_ref<JRuntimeExecutor::jhybridobject>
FabricMountingManagerTestHelper::createRuntimeExecutor() {
  return JRuntimeExecutor::newObjectCxxArgs(runNoJavaScript);
}

jni::local_ref<JRuntimeScheduler::jhybridobject>
FabricMountingManagerTestHelper::createRuntimeScheduler() {
  // Work scheduled here never runs and stays queued. A queued task holds the
  // UIManager, which holds this scheduler, so both outlive the test.
  runtimeScheduler_ = std::make_shared<RuntimeScheduler>(runNoJavaScript);
  return JRuntimeScheduler::newObjectCxxArgs(runtimeScheduler_);
}

void FabricMountingManagerTestHelper::registerViewComponent(
    ComponentFactory* componentFactory) {
  componentFactory->buildRegistryFunction =
      [](const EventDispatcher::Weak& eventDispatcher,
         const std::shared_ptr<const ContextContainer>& contextContainer) {
        auto providerRegistry =
            std::make_shared<ComponentDescriptorProviderRegistry>();
        providerRegistry->add(
            concreteComponentDescriptorProvider<ViewComponentDescriptor>());
        return providerRegistry->createComponentDescriptorRegistry(
            {.eventDispatcher = eventDispatcher,
             .contextContainer = contextContainer,
             .flavor = nullptr});
      };
}

void FabricMountingManagerTestHelper::commitViews(
    jint surfaceId,
    jni::alias_ref<jni::JArrayInt> tags) {
  auto children =
      std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>();
  for (auto tag : toTags(tags)) {
    auto props = std::make_shared<ViewProps>();
    props->collapsable = false;
    children->push_back(viewComponentDescriptor_->createShadowNode(
        {.props = props},
        viewComponentDescriptor_->createFamily(
            {.tag = tag, .surfaceId = surfaceId, .instanceHandle = nullptr})));
  }
  javaUIManager_->getBinding()
      ->getScheduler()
      ->getUIManager()
      ->getShadowTreeRegistry()
      .visit(surfaceId, [&](const ShadowTree& shadowTree) {
        shadowTree.commit(
            [&](const RootShadowNode& oldRootShadowNode) {
              return std::make_shared<RootShadowNode>(
                  oldRootShadowNode,
                  ShadowNodeFragment{
                      .props = ShadowNodeFragment::propsPlaceholder(),
                      .children = children});
            },
            {});
      });
}

void FabricMountingManagerTestHelper::recordPulledDeletes(jint surfaceId) {
  deleteRecorder_ = std::make_shared<DeleteRecorder>();
  javaUIManager_->getBinding()
      ->getScheduler()
      ->getUIManager()
      ->getShadowTreeRegistry()
      .visit(surfaceId, [&](const ShadowTree& shadowTree) {
        shadowTree.getMountingCoordinator()->setMountingOverrideDelegate(
            deleteRecorder_);
      });
}

jni::local_ref<jni::JArrayInt>
FabricMountingManagerTestHelper::pulledDeleteTags() {
  const auto& tags = deleteRecorder_->deletedTags;
  auto array = jni::JArrayInt::newArray(tags.size());
  array->setRegion(0, static_cast<jsize>(tags.size()), tags.data());
  return array;
}

void FabricMountingManagerTestHelper::registerNatives() {
  registerHybrid({
      makeNativeMethod(
          "initHybrid", FabricMountingManagerTestHelper::initHybrid),
      makeNativeMethod(
          "startSurface", FabricMountingManagerTestHelper::startSurface),
      makeNativeMethod(
          "stopSurface", FabricMountingManagerTestHelper::stopSurface),
      makeNativeMethod(
          "preallocateView", FabricMountingManagerTestHelper::preallocateView),
      makeNativeMethod(
          "queuePreallocation",
          FabricMountingManagerTestHelper::queuePreallocation),
      makeNativeMethod(
          "drainPreallocationQueue",
          FabricMountingManagerTestHelper::drainPreallocationQueue),
      makeNativeMethod(
          "executeCreateMutation",
          FabricMountingManagerTestHelper::executeCreateMutation),
      makeNativeMethod(
          "dropFamily", FabricMountingManagerTestHelper::dropFamily),
      makeNativeMethod(
          "destroyUnmountedView",
          FabricMountingManagerTestHelper::destroyUnmountedView),
      makeNativeMethod(
          "destroyCommittedView",
          FabricMountingManagerTestHelper::destroyCommittedView),
      makeNativeMethod(
          "isTagAllocated", FabricMountingManagerTestHelper::isTagAllocated),
      makeNativeMethod(
          "synchronouslyUpdateAnimatedProps",
          FabricMountingManagerTestHelper::synchronouslyUpdateAnimatedProps),
      makeNativeMethod(
          "startSurfaceWithConstraints",
          FabricMountingManagerTestHelper::startSurfaceWithConstraints),
      makeNativeMethod(
          "mountViewWithPadding",
          FabricMountingManagerTestHelper::mountViewWithPadding),
      makeNativeMethod(
          "updateSurfaceConstraints",
          FabricMountingManagerTestHelper::updateSurfaceConstraints),
      makeNativeMethod(
          "overrideFeatureFlags",
          FabricMountingManagerTestHelper::overrideFeatureFlags),
      makeNativeMethod(
          "resetFeatureFlags",
          FabricMountingManagerTestHelper::resetFeatureFlags),
      makeNativeMethod(
          "createRuntimeExecutor",
          FabricMountingManagerTestHelper::createRuntimeExecutor),
      makeNativeMethod(
          "createRuntimeScheduler",
          FabricMountingManagerTestHelper::createRuntimeScheduler),
      makeNativeMethod(
          "registerViewComponent",
          FabricMountingManagerTestHelper::registerViewComponent),
      makeNativeMethod(
          "commitViews", FabricMountingManagerTestHelper::commitViews),
      makeNativeMethod(
          "recordPulledDeletes",
          FabricMountingManagerTestHelper::recordPulledDeletes),
      makeNativeMethod(
          "pulledDeleteTags",
          FabricMountingManagerTestHelper::pulledDeleteTags),
  });
}

} // namespace facebook::react
