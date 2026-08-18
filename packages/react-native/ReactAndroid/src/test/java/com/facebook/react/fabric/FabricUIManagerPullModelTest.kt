/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.fabric

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.testutils.fakes.FakeBatchEventDispatchedListener
import com.facebook.testutils.shadows.ShadowFabricUIManagerBinding
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowPerformanceTracer
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.shadow.api.Shadow

/**
 * Tests for the pull-model notification path: [FabricUIManager.onTransactionAvailable] enqueues a
 * PullTransactionMountItem that asks the (shadowed, JNI-backed) [FabricUIManagerBinding] to pull
 * and apply the surface's pending transaction.
 *
 * The Robolectric test thread is the UI thread, so a notification posted from it dispatches the
 * queued mount items synchronously; notifications posted from a background thread stay queued until
 * the next UI-thread dispatch (in production, the dispatcher's frame callback).
 */
@RunWith(RobolectricTestRunner::class)
@Config(
    shadows =
        [
            ShadowSoLoader::class,
            ShadowNativeLoader::class,
            ShadowPerformanceTracer::class,
            ShadowFabricUIManagerBinding::class,
        ],
)
class FabricUIManagerPullModelTest {

  private lateinit var reactContext: ReactApplicationContext
  private lateinit var underTest: FabricUIManager
  private lateinit var binding: FabricUIManagerBinding
  private lateinit var shadowBinding: ShadowFabricUIManagerBinding

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    reactContext = ReactTestHelper.createCatalystContextForTest()
    underTest =
        FabricUIManager(
            reactContext,
            ViewManagerRegistry(emptyList()),
            FakeBatchEventDispatchedListener(),
        )
    binding = FabricUIManagerBinding()
    shadowBinding = Shadow.extract(binding)
    underTest.setBinding(binding)
  }

  private fun runOnBackgroundThread(block: () -> Unit) {
    var error: Throwable? = null
    val thread = Thread {
      try {
        block()
      } catch (t: Throwable) {
        error = t
      }
    }
    thread.start()
    thread.join()
    error?.let { throw it }
  }

  @Test
  fun onTransactionAvailable_onUiThread_pullsSynchronously() {
    underTest.onTransactionAvailable(1)

    assertThat(shadowBinding.pulledSurfaceIds).containsExactly(1)
  }

  @Test
  fun onTransactionAvailable_enqueuesOnePullPerNotification() {
    // Mirrors iOS: one transaction block per commit, in notification order. Redundant pulls
    // (revisions already consumed by an earlier accumulating pull) no-op in C++, not here.
    runOnBackgroundThread {
      underTest.onTransactionAvailable(1)
      underTest.onTransactionAvailable(2)
      underTest.onTransactionAvailable(1)
    }
    // Notifications from a background (commit) thread are queued, not dispatched.
    assertThat(shadowBinding.pulledSurfaceIds).isEmpty()

    // The next UI-thread dispatch drains them in order.
    underTest.onTransactionAvailable(3)

    assertThat(shadowBinding.pulledSurfaceIds).containsExactly(1, 2, 1, 3)
  }
}
