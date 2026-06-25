/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>

#include <react/fabric/FabricMountingManager.h>

namespace facebook::react {

/**
 * JNI test helper that wraps a real FabricMountingManager
 */
class FabricMountingManagerTestHelper : public jni::HybridClass<FabricMountingManagerTestHelper> {
 public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/fabric/FabricMountingManagerTestHelper;";

  void startSurface(jint surfaceId);
  void stopSurface(jint surfaceId);
  void preallocateView(jint surfaceId, jint tag);
  void destroyUnmountedView(jint surfaceId, jint tag);
  bool isTagAllocated(jint surfaceId, jint tag);

  static void registerNatives();

 private:
  friend HybridBase;

  explicit FabricMountingManagerTestHelper(jni::alias_ref<JFabricUIManager::javaobject> jFabricUIManager);

  static void initHybrid(
      jni::alias_ref<jhybridobject> jobj,
      jni::alias_ref<JFabricUIManager::javaobject> jFabricUIManager);

  jni::global_ref<JFabricUIManager::javaobject> javaUIManager_;
  std::shared_ptr<FabricMountingManager> mountingManager_;
  std::unique_ptr<ViewComponentDescriptor> viewComponentDescriptor_;
};

} // namespace facebook::react
