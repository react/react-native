/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.activityresult

import android.app.Activity
import android.os.Bundle
import android.os.Looper
import androidx.activity.result.ActivityResultRegistry
import androidx.activity.result.ActivityResultRegistryOwner
import androidx.activity.result.contract.ActivityResultContract
import androidx.activity.result.contract.ActivityResultContracts.GetContent
import androidx.core.app.ActivityOptionsCompat
import com.facebook.react.bridge.ReactApplicationContext
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf

/**
 * `ActivityResultRegistry` is `@MainThread` and its key tables are unsynchronized plain maps, but
 * the annotation is not enforced at runtime -- off-thread access corrupts them silently rather than
 * throwing. Native modules are constructed on the JS thread and their methods run on the
 * native-modules thread, so every call into the registry has to be hopped to the UI thread.
 *
 * These tests pin that down by driving the caller from a background thread and asserting the
 * registry is untouched until the main looper runs.
 */
@RunWith(RobolectricTestRunner::class)
class ReactActivityResultCallerThreadingTest {

  private class RecordingRegistry : ActivityResultRegistry() {
    val launchThreads = mutableListOf<String>()

    override fun <I, O> onLaunch(
        requestCode: Int,
        contract: ActivityResultContract<I, O>,
        input: I,
        options: ActivityOptionsCompat?,
    ) {
      launchThreads += Thread.currentThread().name
    }

    /** [onSaveInstanceState] is the only public window into the registry's key table. */
    val registeredKeys: List<String>
      get() =
          Bundle()
              .also { onSaveInstanceState(it) }
              .getStringArrayList("KEY_COMPONENT_ACTIVITY_REGISTERED_KEYS")
              .orEmpty()
  }

  class TestActivity : Activity(), ActivityResultRegistryOwner {
    override val activityResultRegistry: ActivityResultRegistry = RecordingRegistry()
  }

  private class ModuleA

  private lateinit var registry: RecordingRegistry
  private lateinit var reactContext: ReactApplicationContext
  private lateinit var caller: ReactActivityResultCallerImpl

  private val moduleA = ModuleA()
  private val expectedKey = "${ModuleA::class.java.name}:${GetContent::class.java.name}"

  @Before
  fun setUp() {
    reactContext = mock<ReactApplicationContext>()
    registry = resumeNewActivity()
    caller = ReactActivityResultCallerImpl(reactContext)
  }

  /** Stands in for a new Activity becoming current, and returns its registry. */
  private fun resumeNewActivity(): RecordingRegistry {
    val activity = Robolectric.buildActivity(TestActivity::class.java).create().get()
    whenever(reactContext.currentActivity).thenReturn(activity)
    return activity.activityResultRegistry as RecordingRegistry
  }

  private fun onBackgroundThread(block: () -> Unit) {
    var failure: Throwable? = null
    val thread = Thread { runCatching(block).onFailure { failure = it } }
    thread.start()
    thread.join(10_000)
    failure?.let { throw it }
  }

  private fun drainMainLooper() = shadowOf(Looper.getMainLooper()).idle()

  @Test
  fun `registering off the UI thread defers the registry call to the UI thread`() {
    onBackgroundThread { caller.registerForActivityResult(moduleA, GetContent()) {} }

    assertThat(registry.registeredKeys)
        .describedAs("registry.register must not run on the caller's thread")
        .isEmpty()

    drainMainLooper()

    assertThat(registry.registeredKeys).containsExactly(expectedKey)
  }

  @Test
  fun `the launcher is returned synchronously even though binding is deferred`() {
    lateinit var launcher: Any
    onBackgroundThread { launcher = caller.registerForActivityResult(moduleA, GetContent()) {} }

    // Registering in a field initializer depends on this: the launcher is usable immediately.
    assertThat(launcher).isInstanceOf(DeferredActivityResultLauncher::class.java)
  }

  @Test
  fun `a duplicate key still throws on the caller's own thread`() {
    caller.registerForActivityResult(moduleA, GetContent()) {}
    drainMainLooper()

    var thrown: Throwable? = null
    onBackgroundThread {
      thrown = runCatching { caller.registerForActivityResult(moduleA, GetContent()) {} }.exceptionOrNull()
    }

    // Not surfaced later on the UI thread, where it would be unattributable.
    assertThat(thrown).isInstanceOf(IllegalStateException::class.java)
  }

  @Test
  fun `launching off the UI thread defers onLaunch to the UI thread`() {
    val launcher = caller.registerForActivityResult(moduleA, GetContent()) {}
    drainMainLooper()

    onBackgroundThread { launcher.launch("image/*") }

    assertThat(registry.launchThreads)
        .describedAs("registry.onLaunch must not run on the caller's thread")
        .isEmpty()

    drainMainLooper()

    assertThat(registry.launchThreads).containsExactly(Looper.getMainLooper().thread.name)
  }

  /**
   * Multi-Activity navigation: B resumes while A is still alive, and `ReactHostImpl` then drops
   * A's `onHostDestroy` because `currentActivity` has already moved to B. So no unbind ever runs
   * for A -- `onHostResume` alone has to move the launcher across.
   */
  @Test
  fun `resuming a second activity rebinds to its registry without any onHostDestroy`() {
    val launcher = caller.registerForActivityResult(moduleA, GetContent()) {}
    drainMainLooper()
    val registryA = registry

    val registryB = resumeNewActivity()
    caller.onHostResume() // note: no onHostDestroy for A, exactly as ReactHostImpl behaves
    drainMainLooper()

    assertThat(registryB.registeredKeys)
        .describedAs("the launcher must follow the current Activity")
        .containsExactly(expectedKey)
    assertThat(registryA.registeredKeys)
        .describedAs("staying registered on the dead registry leaks the old Activity")
        .isEmpty()

    launcher.launch("image/*")
    drainMainLooper()

    assertThat(registryB.launchThreads).hasSize(1)
    assertThat(registryA.launchThreads)
        .describedAs("a launch from the new screen must not dispatch into the old Activity")
        .isEmpty()
  }

  @Test
  fun `resuming the same activity again does not re-register`() {
    caller.registerForActivityResult(moduleA, GetContent()) {}
    drainMainLooper()

    caller.onHostResume()
    caller.onHostResume()
    drainMainLooper()

    assertThat(registry.registeredKeys).containsExactly(expectedKey)
  }

  @Test
  fun `two threads racing to claim one key produce exactly one winner`() {
    val start = CountDownLatch(1)
    val done = CountDownLatch(2)
    val failures = mutableListOf<Throwable>()

    repeat(2) {
      Thread {
            start.await()
            runCatching { caller.registerForActivityResult(moduleA, GetContent()) {} }
                .onFailure { e -> synchronized(failures) { failures += e } }
            done.countDown()
          }
          .start()
    }
    start.countDown()
    done.await(10, TimeUnit.SECONDS)
    drainMainLooper()

    // Claiming the key is one atomic operation, so the loser always sees the collision.
    assertThat(failures).hasSize(1)
    assertThat(failures.single()).isInstanceOf(IllegalStateException::class.java)
    assertThat(registry.registeredKeys).containsExactly(expectedKey)
  }

  @Test
  fun `a launch issued before binding is queued and fires once bound`() {
    lateinit var launcher: Any
    onBackgroundThread {
      launcher = caller.registerForActivityResult(moduleA, GetContent()) {}
      @Suppress("UNCHECKED_CAST")
      (launcher as DeferredActivityResultLauncher<String>).launch("image/*")
    }

    assertThat(registry.launchThreads).isEmpty()

    drainMainLooper()

    // Bind and the queued launch both land on the UI thread, in that order.
    assertThat(registry.registeredKeys).containsExactly(expectedKey)
    assertThat(registry.launchThreads).containsExactly(Looper.getMainLooper().thread.name)
  }
}
