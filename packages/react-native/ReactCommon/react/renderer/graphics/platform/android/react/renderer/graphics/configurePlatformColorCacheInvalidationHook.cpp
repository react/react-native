/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fbjni/NativeRunnable.h>
#include <fbjni/fbjni.h>
#include <functional>

namespace facebook::react {
void configurePlatformColorCacheInvalidationHook(std::function<void()>&& hook) {
  auto appearanceModuleClass = jni::findClassLocal(
      "com/facebook/react/modules/appearance/AppearanceModule");
  if (appearanceModuleClass) {
    auto callbackField =
        appearanceModuleClass->getStaticField<jni::JRunnable::javaobject>(
            "invalidatePlatformColorCache");
    jni::local_ref<jni::JRunnable> invalidationCallback =
        jni::JNativeRunnable::newObjectCxxArgs(std::move(hook));
    appearanceModuleClass->setStaticFieldValue(
        callbackField, invalidationCallback.get());
  }
}
} // namespace facebook::react
