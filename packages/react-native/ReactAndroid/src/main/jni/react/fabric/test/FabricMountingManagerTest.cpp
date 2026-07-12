/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/fabric/FabricMountingManager.h>

#include <fbjni/fbjni.h>
#include <gtest/gtest.h>

#include <memory>

namespace facebook::react {

/**
 * Pure-C++ unit tests for the surface-registry behavior of
 * `FabricMountingManager`. The class as a whole is heavily JNI-coupled; full
 * end-to-end coverage lives in the Robolectric-driven instrumentation tests
 * under
 * `ReactAndroid/src/test/java/com/facebook/react/fabric/FabricMountingManagerInstrumentationTest`.
 *
 * These tests focus on the small, JNI-free slice of the public API:
 *   - `onSurfaceStart`  — populates the allocated-view registry for a new
 *                         surface.
 *   - `onSurfaceStop`   — removes the registry entry for a surface.
 *   - `isViewAllocated` — returns whether a `(surfaceId, tag)` pair is
 *                         registered.
 *
 * These three methods only touch in-memory state guarded by
 * `allocatedViewsMutex_`; they never call into Java. That is what makes them
 * unit-testable here.
 *
 * NOTE: `~FabricMountingManager()` calls `jni::ThreadScope::WithClassLoader`,
 * which throws `std::runtime_error` when no JavaVM has been attached (see
 * `xplat/spectrum/androidLibs/fbjni/cxx/fbjni/detail/Environment.h`). Because
 * no JVM is available in this host-side test, the manager instance is
 * intentionally never destroyed: each test allocates a single
 * `FabricMountingManager` on the heap and wraps it in a `std::shared_ptr`
 * with a no-op deleter. The resulting per-test leak is bounded (one ~100-byte
 * instance) and does not cross test boundaries.
 */
class FabricMountingManagerTest : public ::testing::Test {
 protected:
  // Returns a `FabricMountingManager` whose destructor is suppressed.
  // See the class-level note above for why this is necessary.
  static std::shared_ptr<FabricMountingManager> makeManager() {
    // `jni::global_ref<>` default-constructs to an empty (null) reference,
    // so no JNI calls are performed during construction. The empty
    // reference is safe to copy into the manager because the
    // surface-registry methods under test never dereference
    // `javaUIManager_`.
    auto* emptyRef = new jni::global_ref<JFabricUIManager::javaobject>();
    auto* raw = new FabricMountingManager(*emptyRef);
    // `emptyRef` is intentionally leaked: resetting it would also engage
    // `WithClassLoader`, which requires an attached JavaVM.
    return {raw, [](FabricMountingManager* /*unused*/) noexcept {
              // No-op deleter: see class-level note.
            }};
  }
};

/*
 * Verifies that `onSurfaceStart` seeds the allocated-view registry for the
 * new surface with the surface tag itself. Downstream, `executeMount` relies
 * on this seeding to detect "executing commit after surface ... was stopped"
 * and to short-circuit a redundant Create mount item for the root view.
 *
 * Bug this catches: if a refactor stops registering the root surface tag
 * (e.g. switches to `unordered_set<Tag>{}` instead of
 * `unordered_set<Tag>({surfaceId})`), the root view would be re-created on
 * every commit. Without this assertion, that regression would only surface
 * via end-to-end Java tests.
 */
TEST_F(
    FabricMountingManagerTest,
    onSurfaceStartRegistersSurfaceTagAsAllocated) {
  auto manager = makeManager();
  constexpr SurfaceId kSurfaceId = 42;

  manager->onSurfaceStart(kSurfaceId);

  EXPECT_TRUE(manager->isViewAllocated(kSurfaceId, /*tag=*/kSurfaceId));
}

/*
 * Verifies that `isViewAllocated` returns false for a surface that has not
 * been started. The contract is "false when the surface is unknown", not
 * "throw" or "abort"; `executeMount` and `preallocateShadowView` both rely
 * on this to gracefully no-op when a surface has been stopped concurrently.
 */
TEST_F(
    FabricMountingManagerTest,
    isViewAllocatedReturnsFalseForSurfaceThatWasNeverStarted) {
  auto manager = makeManager();

  // Tag is arbitrary; the registry has no entry for surface 9999 so any
  // tag must report unallocated.
  EXPECT_FALSE(manager->isViewAllocated(/*surfaceId=*/9999, /*tag=*/12345));
}

/*
 * Verifies that `onSurfaceStop` removes the surface's entire registry entry
 * — not just clears its contents. After `onSurfaceStop`, `isViewAllocated`
 * must return false for *any* tag on that surface, including the surface
 * tag itself (which `onSurfaceStart` had inserted).
 *
 * Bug this catches: if `onSurfaceStop` only `.clear()`-ed the inner set
 * instead of erasing the outer map entry, `executeMount`'s "surface was
 * stopped" log would never fire, masking commit-after-stop bugs.
 */
TEST_F(
    FabricMountingManagerTest,
    onSurfaceStopRemovesEntireRegistryForSurface) {
  auto manager = makeManager();
  constexpr SurfaceId kSurfaceId = 7;
  manager->onSurfaceStart(kSurfaceId);
  ASSERT_TRUE(manager->isViewAllocated(kSurfaceId, kSurfaceId));

  manager->onSurfaceStop(kSurfaceId);

  EXPECT_FALSE(manager->isViewAllocated(kSurfaceId, kSurfaceId));
}

/*
 * Verifies that registries for distinct surfaces are isolated: starting and
 * stopping one surface must not leak state into another. This is the
 * concurrency-safety invariant that lets multiple React surfaces coexist in
 * the same process.
 *
 * Bug this catches: if a future change accidentally shared the
 * `unordered_set<Tag>` across surfaces (e.g. via a misplaced static), tags
 * from one surface would falsely appear as allocated on another, and
 * stopping any surface would purge unrelated surfaces' registries.
 */
TEST_F(
    FabricMountingManagerTest,
    onSurfaceStartCreatesIsolatedRegistriesPerSurface) {
  auto manager = makeManager();
  constexpr SurfaceId kSurfaceA = 1;
  constexpr SurfaceId kSurfaceB = 2;

  manager->onSurfaceStart(kSurfaceA);
  manager->onSurfaceStart(kSurfaceB);

  // Each surface knows about its own tag but not the other surface's tag.
  EXPECT_TRUE(manager->isViewAllocated(kSurfaceA, /*tag=*/kSurfaceA));
  EXPECT_FALSE(manager->isViewAllocated(kSurfaceA, /*tag=*/kSurfaceB));
  EXPECT_TRUE(manager->isViewAllocated(kSurfaceB, /*tag=*/kSurfaceB));
  EXPECT_FALSE(manager->isViewAllocated(kSurfaceB, /*tag=*/kSurfaceA));

  // Stopping surface A must not affect surface B.
  manager->onSurfaceStop(kSurfaceA);
  EXPECT_FALSE(manager->isViewAllocated(kSurfaceA, kSurfaceA));
  EXPECT_TRUE(manager->isViewAllocated(kSurfaceB, kSurfaceB));
}

} // namespace facebook::react
