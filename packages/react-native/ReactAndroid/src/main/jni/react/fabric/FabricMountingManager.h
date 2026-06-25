/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <mutex>
#include <unordered_map>
#include <unordered_set>

#include <fbjni/fbjni.h>
#include <react/fabric/JFabricUIManager.h>
#include <react/renderer/uimanager/primitives.h>

namespace facebook::react {

class MountingTransaction;
struct ShadowView;

class FabricMountingManager final {
 public:
  FabricMountingManager(jni::global_ref<JFabricUIManager::javaobject> &javaUIManager);
  FabricMountingManager(const FabricMountingManager &) = delete;
  ~FabricMountingManager();

  void onSurfaceStart(SurfaceId surfaceId);

  void onSurfaceStop(SurfaceId surfaceId);

  void maybePreallocateShadowNode(const ShadowNode &shadowNode);

  void destroyUnmountedShadowNode(const ShadowNodeFamily &family);

  /*
   * Drains preallocatedViewsQueue_ by calling preallocateShadowView on each
   * item in the queue. Can be called by any thread.
   */
  void drainPreallocateViewsQueue();

  /*
   * Preallocates a view on the Java side and registers the tag in
   * allocatedViewRegistry_ so that executeMount skips the redundant Create
   * mount item for this tag.
   */
  void preallocateShadowView(const ShadowView &shadowView);

  /*
   * Returns true if the given tag is registered in allocatedViewRegistry_
   * for the given surface. A registered tag means executeMount will skip
   * the Create mount item (the view was already preallocated).
   */
  bool isViewAllocated(SurfaceId surfaceId, Tag tag);

  void executeMount(const MountingTransaction &transaction);

  void dispatchCommand(const ShadowView &shadowView, const std::string &commandName, const folly::dynamic &args);

  void sendAccessibilityEvent(const ShadowView &shadowView, const std::string &eventType);

  void setIsJSResponder(const ShadowView &shadowView, bool isJSResponder, bool blockNativeResponder);

  void onAnimationStarted();

  void onAllAnimationsComplete();

  void synchronouslyUpdateViewOnUIThread(Tag viewTag, const folly::dynamic &props);

  void captureViewSnapshot(Tag tag, SurfaceId surfaceId);

  void setViewSnapshot(Tag sourceTag, Tag targetTag, SurfaceId surfaceId);

  void clearPendingSnapshots();

  void scheduleReactRevisionMerge(SurfaceId surfaceId);

 private:
  bool isOnMainThread();

  jni::global_ref<JFabricUIManager::javaobject> javaUIManager_;

  std::recursive_mutex commitMutex_;

  /*
   * Protects preallocatedViewsQueue_.
   */
  std::mutex preallocateMutex_;

  /*
   * A queue of views to be preallocated on the Java side.
   */
  std::vector<ShadowView> preallocatedViewsQueue_{};

  std::unordered_map<SurfaceId, std::unordered_set<Tag>> allocatedViewRegistry_{};
  std::recursive_mutex allocatedViewsMutex_;
};

} // namespace facebook::react
