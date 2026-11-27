/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fb/glog_init.h>
#include <fbjni/fbjni.h>
#include <react/jni/JReactMarker.h>

#include "JJSTimerExecutor.h"
#include "JReactHostInspectorTarget.h"
#include "JReactInstance.h"

#ifndef WITH_GLOGINIT
#define WITH_GLOGINIT 1
#endif

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void* /*unused*/) {
  return facebook::jni::initialize(vm, [] {
#if WITH_GLOGINIT
    facebook::gloginit::initialize();
#endif
    facebook::react::JReactMarker::setLogPerfMarkerIfNeeded();
    facebook::react::JReactInstance::registerNatives();
    facebook::react::JJSTimerExecutor::registerNatives();
    facebook::react::JReactHostInspectorTarget::registerNatives();
  });
}
