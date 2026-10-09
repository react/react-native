/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/jni/NativeMap.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>

#include <react/fabric/FabricMountingManager.h>

#include <unordered_map>

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
  void queuePreallocation(jint surfaceId, jint tag);
  void drainPreallocationQueue();
  void mountCreate(jint surfaceId, jint tag);
  void dropFamily(jint tag);
  void destroyUnmountedView(jint surfaceId, jint tag);
  void destroyCommittedView(jint surfaceId, jint tag);
  bool isTagAllocated(jint surfaceId, jint tag);
  void synchronouslyUpdateAnimatedProps(
      jni::alias_ref<jni::JArrayInt> tags,
      jni::alias_ref<jni::JArrayClass<NativeMap::javaobject>> props);

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
  std::unordered_map<Tag, std::shared_ptr<const ShadowNode>> queuedShadowNodes_;
};

} // namespace facebook::react
