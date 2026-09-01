/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "StateWrapperImpl.h"
#include <fbjni/fbjni.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/renderer/core/EventQueue.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>

using namespace facebook::jni;

namespace facebook::react {

/**
 * Called from Java constructor through the JNI.
 */
void StateWrapperImpl::initHybrid(jni::alias_ref<jhybridobject> jobj) {
  return setCxxInstance(jobj);
}

jni::local_ref<ReadableNativeMap::jhybridobject>
StateWrapperImpl::getStateDataImpl() {
  if (state_) {
    folly::dynamic map = state_->getDynamic();
    return ReadableNativeMap::newObjectCxxArgs(std::move(map));
  } else {
    return nullptr;
  }
}

jni::local_ref<JReadableMapBuffer::jhybridobject>
StateWrapperImpl::getStateMapBufferDataImpl() {
  if (state_) {
    MapBuffer map = state_->getMapBuffer();
    return JReadableMapBuffer::createWithContents(std::move(map));
  } else {
    return nullptr;
  }
}

jni::local_ref<jobject> StateWrapperImpl::getStateDataReferenceImpl() {
  if (state_) {
    return state_->getJNIReference();
  }
  return nullptr;
}

void StateWrapperImpl::updateStateImpl(NativeMap* map, jint updateMode) {
  if (state_) {
    // Get folly::dynamic from map
    auto dynamicMap = map->consume();
    // Set state
    state_->updateState(
        std::move(dynamicMap),
        static_cast<EventQueue::UpdateMode>(updateMode));
  }
}

void StateWrapperImpl::setState(std::shared_ptr<const State> state) {
  state_ = state;
}

std::shared_ptr<const State> StateWrapperImpl::getState() const {
  return state_;
}

void StateWrapperImpl::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", StateWrapperImpl::initHybrid),
      makeNativeMethod("getStateDataImpl", StateWrapperImpl::getStateDataImpl),
      makeNativeMethod("updateStateImpl", StateWrapperImpl::updateStateImpl),
      makeNativeMethod(
          "getStateMapBufferDataImpl",
          StateWrapperImpl::getStateMapBufferDataImpl),
      makeNativeMethod(
          "getStateDataReferenceImpl",
          StateWrapperImpl::getStateDataReferenceImpl),
  });
}

} // namespace facebook::react
