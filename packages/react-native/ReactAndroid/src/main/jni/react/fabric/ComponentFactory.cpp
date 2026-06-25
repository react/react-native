/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ComponentFactory.h"
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <react/renderer/componentregistry/ComponentDescriptorRegistry.h>

using namespace facebook::jsi;

namespace facebook::react {

jni::local_ref<ComponentFactory::jhybriddata> ComponentFactory::initHybrid(
    jni::alias_ref<jclass> /*unused*/) {
  return makeCxxInstance();
}

void ComponentFactory::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", ComponentFactory::initHybrid),
  });
}

} // namespace facebook::react
