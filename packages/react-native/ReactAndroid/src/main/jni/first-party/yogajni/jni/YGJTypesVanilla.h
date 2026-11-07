/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <map>
#include <vector>

#include <yoga/Yoga.h>

#include "common.h"
#include "jni.h" // @manual=fbsource//xplat/yoga/lib/jni:jni

class PtrJNodeMapVanilla {
  std::map<YGNodeConstRef, jsize> ptrsToIdxs_{};
  jobjectArray javaNodes_{};

 public:
  PtrJNodeMapVanilla() = default;

  PtrJNodeMapVanilla(jlongArray javaNativePointers, jobjectArray javaNodes)
      : javaNodes_{javaNodes} {
    using namespace facebook::yoga::vanillajni;

    JNIEnv* env = getCurrentEnv();
    jsize nativePointersSize = env->GetArrayLength(javaNativePointers);
    std::vector<jlong> nativePointers(static_cast<size_t>(nativePointersSize));
    env->GetLongArrayRegion(
        javaNativePointers, 0, nativePointersSize, nativePointers.data());

    for (jsize i = 0; i < nativePointersSize; ++i) {
      ptrsToIdxs_[(YGNodeConstRef)nativePointers[static_cast<size_t>(i)]] = i;
    }
  }

  facebook::yoga::vanillajni::ScopedLocalRef<jobject> ref(YGNodeConstRef node) {
    using namespace facebook::yoga::vanillajni;

    JNIEnv* env = getCurrentEnv();
    auto idx = ptrsToIdxs_.find(node);
    if (idx == ptrsToIdxs_.end()) {
      return ScopedLocalRef<jobject>(env);
    } else {
      return make_local_ref(
          env, env->GetObjectArrayElement(javaNodes_, idx->second));
    }
  }
};
