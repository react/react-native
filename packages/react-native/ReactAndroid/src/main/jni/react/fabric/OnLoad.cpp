/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fbjni/fbjni.h>

#include "ComponentFactory.h"
#include "EventBeatManager.h"
#include "EventEmitterWrapper.h"
#include "FabricUIManagerBinding.h"
#include "KeyboardAvoidingViewBinding.h"
#include "StateWrapperImpl.h"
#include "SurfaceHandlerBinding.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void* /*unused*/) {
  return facebook::jni::initialize(vm, [] {
    facebook::react::EventBeatManager::registerNatives();
    facebook::react::EventEmitterWrapper::registerNatives();
    facebook::react::FabricUIManagerBinding::registerNatives();
    facebook::react::KeyboardAvoidingViewBinding::registerNatives();
    facebook::react::StateWrapperImpl::registerNatives();
    facebook::react::ComponentFactory::registerNatives();
    facebook::react::SurfaceHandlerBinding::registerNatives();
  });
}
