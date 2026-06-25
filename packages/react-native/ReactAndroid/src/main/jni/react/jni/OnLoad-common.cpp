/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fbjni/fbjni.h>
#include "JCallback.h"
#include "JDynamicNative.h"
#include "JReactMarker.h"
#include "NativeArray.h"
#include "NativeMap.h"
#include "WritableNativeArray.h"
#include "WritableNativeMap.h"

namespace facebook::react {

extern "C" JNIEXPORT jint JNI_OnLoad(JavaVM* vm, void* reserved) {
  return facebook::jni::initialize(vm, [] {
    JCxxCallbackImpl::registerNatives();
    JDynamicNative::registerNatives();
    JReactMarker::registerNatives();
    NativeArray::registerNatives();
    NativeMap::registerNatives();
    ReadableNativeArray::registerNatives();
    ReadableNativeMap::registerNatives();
    WritableNativeArray::registerNatives();
    WritableNativeMap::registerNatives();
  });
}

} // namespace facebook::react
