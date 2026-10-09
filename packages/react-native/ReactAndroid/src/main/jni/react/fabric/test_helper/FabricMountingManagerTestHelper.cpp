/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FabricMountingManagerTestHelper.h"

#include <react/renderer/animationbackend/AnimatedProps.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/ComponentDescriptor.h>
#include <react/renderer/mounting/MountingTransaction.h>
#include <react/renderer/mounting/ShadowView.h>
#include <react/renderer/telemetry/TransactionTelemetry.h>

namespace facebook::react {

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

} // namespace

FabricMountingManagerTestHelper::FabricMountingManagerTestHelper(
    jni::alias_ref<JFabricUIManager::javaobject> jFabricUIManager)
    : javaUIManager_(jni::make_global(jFabricUIManager)) {
  mountingManager_ = std::make_shared<FabricMountingManager>(javaUIManager_);

  auto params = ComponentDescriptorParameters{
      .eventDispatcher = EventDispatcher::Shared{},
      .contextContainer = std::make_shared<ContextContainer>(),
      .flavor = nullptr};
  viewComponentDescriptor_ = std::make_unique<ViewComponentDescriptor>(params);
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

void FabricMountingManagerTestHelper::mountCreate(jint surfaceId, jint tag) {
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
          "mountCreate", FabricMountingManagerTestHelper::mountCreate),
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
  });
}

} // namespace facebook::react
