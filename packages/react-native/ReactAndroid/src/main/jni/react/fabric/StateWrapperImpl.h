/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/common/mapbuffer/JReadableMapBuffer.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/renderer/core/State.h>
#include <react/uimanager/StateWrapper.h>

namespace facebook::react {

class Instance;

class StateWrapperImpl : public jni::HybridClass<StateWrapperImpl, StateWrapper> {
 public:
  constexpr static const char *const kJavaDescriptor = "Lcom/facebook/react/fabric/StateWrapperImpl;";
  constexpr static auto StateWrapperImplJavaDescriptor = "com/facebook/react/fabric/StateWrapperImpl";

  static void registerNatives();

  jni::local_ref<JReadableMapBuffer::jhybridobject> getStateMapBufferDataImpl();
  jni::local_ref<ReadableNativeMap::jhybridobject> getStateDataImpl();
  jni::local_ref<jobject> getStateDataReferenceImpl();
  void updateStateImpl(NativeMap *map);
  void setState(std::shared_ptr<const State> state);
  std::shared_ptr<const State> getState() const;

 private:
  std::shared_ptr<const State> state_;

  static void initHybrid(jni::alias_ref<jhybridobject> jobj);
};

} // namespace facebook::react
