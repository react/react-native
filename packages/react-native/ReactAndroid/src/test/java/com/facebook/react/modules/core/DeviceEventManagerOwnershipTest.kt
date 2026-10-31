/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * Licensed under the MIT license in the root directory of this source tree.
 */
package com.facebook.react.modules.core

import com.facebook.react.BackNavigationCoordinator
import com.facebook.react.ReactActivity
import com.facebook.react.bridge.ReactApplicationContext
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.doAnswer
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class DeviceEventManagerOwnershipTest {
  @Test
  fun destroyedActivityReleasesOwnershipAndResumeRestoresItOnNewActivity() {
    val context = mock<ReactApplicationContext>()
    val oldActivity = mock<ReactActivity>()
    val newActivity = mock<ReactActivity>()
    val oldCoordinator = BackNavigationCoordinator()
    val newCoordinator = BackNavigationCoordinator()
    whenever(oldActivity.backNavigationCoordinator).thenReturn(oldCoordinator)
    whenever(newActivity.backNavigationCoordinator).thenReturn(newCoordinator)
    whenever(context.currentActivity).thenReturn(oldActivity)
    doAnswer {
        it.getArgument<Runnable>(0).run()
        null
      }
      .whenever(context)
      .runOnUiQueueThread(any())
    val module = DeviceEventManagerModule(context, null)
    module.setNativeNavigationEnabled(true, false)
    module.onHostDestroy()
    assertThat(oldCoordinator.isNativeNavigationEnabled).isFalse()
    whenever(context.currentActivity).thenReturn(newActivity)
    module.onHostResume()
    assertThat(newCoordinator.isNativeNavigationEnabled).isTrue()
    assertThat(newCoordinator.isJavaScriptEnabled).isFalse()
  }

  @Test
  fun queuedUpdatesCannotReclaimOwnershipAfterInvalidation() {
    val context = mock<ReactApplicationContext>()
    val activity = mock<ReactActivity>()
    val coordinator = BackNavigationCoordinator()
    whenever(context.currentActivity).thenReturn(activity)
    whenever(activity.backNavigationCoordinator).thenReturn(coordinator)
    val queue = mutableListOf<Runnable>()
    doAnswer {
        queue.add(it.getArgument(0))
        null
      }
      .whenever(context)
      .runOnUiQueueThread(any())
    val module = DeviceEventManagerModule(context, null)
    module.setNativeNavigationEnabled(true, false)
    module.invalidate()
    module.setNativeNavigationEnabled(true, false)
    queue.forEach { it.run() }
    module.onHostResume()
    assertThat(coordinator.isNativeNavigationEnabled).isFalse()
  }

  @Test
  fun oldModuleTeardownCannotResetNewModule() {
    val context = mock<ReactApplicationContext>()
    val activity = mock<ReactActivity>()
    val coordinator = BackNavigationCoordinator()
    whenever(context.currentActivity).thenReturn(activity)
    whenever(activity.backNavigationCoordinator).thenReturn(coordinator)
    doAnswer {
        it.getArgument<Runnable>(0).run()
        null
      }
      .whenever(context)
      .runOnUiQueueThread(any())
    val old = DeviceEventManagerModule(context, null)
    old.setNativeNavigationEnabled(true, true)
    val current = DeviceEventManagerModule(context, null)
    current.setNativeNavigationEnabled(true, false)
    old.invalidate()
    current.onHostResume()
    assertThat(coordinator.isNativeNavigationEnabled).isTrue()
    assertThat(coordinator.isJavaScriptEnabled).isFalse()
  }
}
