/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/jni/ModuleRegistryBuilder.h>

#include <fbjni/fbjni.h>
#include <gtest/gtest.h>

#include <memory>

#ifndef RCT_REMOVE_LEGACY_ARCH

namespace facebook::react {

/**
 * Pure-C++ unit tests for the JNI-free slice of `ModuleRegistryBuilder.cpp`.
 *
 * The bulk of this translation unit is JNI-coupled: `ModuleHolder::getName`
 * and `ModuleHolder::getProvider` both call into a live JavaVM (via
 * `getClass()` / `jni::make_global(self())`), so their behaviour is
 * exercised by the Robolectric / instrumentation tests that run against a
 * real JVM.
 *
 * The one branch that can be validated host-side without an attached JavaVM
 * is `buildNativeModuleList`'s null-collection guard: when the incoming
 * `alias_ref<JCollection<...>>` is a null reference, the function must
 * short-circuit and return an empty vector rather than dereferencing the
 * null collection. `alias_ref` is default-constructible to a null state
 * whose `operator bool()` returns false, which is exactly what
 * `buildNativeModuleList`'s `if (javaModules)` check tests against, so we
 * can drive that path without touching JNI.
 */

/*
 * Verifies the null-input contract of `buildNativeModuleList`: when the
 * `javaModules` collection is a null `alias_ref`, no `JavaNativeModule`
 * instances are constructed and the returned vector is empty.
 *
 * Bug this catches: if the `if (javaModules)` guard is ever removed or
 * inverted, the subsequent `for (const auto& jm : *javaModules)` would
 * dereference a null JNI reference and crash the process on every startup
 * path that leaves `javaModules` unset (for example, new-architecture
 * bring-up paths that legitimately pass no legacy Java modules). Because
 * the crash would only surface once the process actually reaches this
 * code with a null collection, catching it here — instead of relying on
 * a device-side smoke test — is the earliest signal available.
 *
 * The `Instance` weak_ptr and `MessageQueueThread` shared_ptr are supplied
 * as empty on purpose: the guard runs before either is dereferenced, so
 * their state must not affect the null-collection contract.
 */
TEST(
    ModuleRegistryBuilderTest,
    buildNativeModuleListReturnsEmptyForNullCollection) {
  std::weak_ptr<Instance> noInstance;
  std::shared_ptr<MessageQueueThread> noQueue;
  jni::alias_ref<jni::JCollection<JavaModuleWrapper::javaobject>::javaobject>
      nullCollection;
  ASSERT_FALSE(static_cast<bool>(nullCollection))
      << "Precondition: default-constructed alias_ref must be null so that "
         "the guard under test is actually exercised.";

  auto modules = buildNativeModuleList(noInstance, nullCollection, noQueue);

  EXPECT_TRUE(modules.empty());
}

} // namespace facebook::react

#endif
