/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fbjni/fbjni.h>

#include "BlobCollector.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void* /*unused*/) {
  return facebook::jni::initialize(
      vm, [] { facebook::react::BlobModuleJSIBindings::registerNatives(); });
}
