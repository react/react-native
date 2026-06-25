/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FabricMountingManagerTestHelper.h"

#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/ComponentDescriptor.h>
#include <react/renderer/mounting/ShadowView.h>

namespace facebook::react {

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
  ShadowView sv{};
  sv.componentName = "View";
  sv.surfaceId = surfaceId;
  sv.tag = tag;
  sv.props = std::make_shared<const ViewProps>();
  sv.layoutMetrics.frame.size = {.width = 100, .height = 100};
  mountingManager_->preallocateShadowView(sv);
}

void FabricMountingManagerTestHelper::destroyUnmountedView(
    jint surfaceId,
    jint tag) {
  auto family = viewComponentDescriptor_->createFamily(
      {.tag = tag, .surfaceId = surfaceId, .instanceHandle = nullptr});
  mountingManager_->destroyUnmountedShadowNode(*family);
}

bool FabricMountingManagerTestHelper::isTagAllocated(jint surfaceId, jint tag) {
  return mountingManager_->isViewAllocated(surfaceId, tag);
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
          "destroyUnmountedView",
          FabricMountingManagerTestHelper::destroyUnmountedView),
      makeNativeMethod(
          "isTagAllocated", FabricMountingManagerTestHelper::isTagAllocated),
  });
}

} // namespace facebook::react
