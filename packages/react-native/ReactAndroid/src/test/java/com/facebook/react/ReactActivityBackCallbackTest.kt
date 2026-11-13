/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import android.os.Bundle
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
class ReactActivityBackCallbackTest {

  @Test
  @Config(sdk = [33, 34, 35])
  fun targetSdk36_backFromDispatcher_reachesReactDelegate() {
    val activity = createActivity(targetSdkVersion = 36, handledByJs = true)

    assertThat(activity.onBackPressedDispatcher.hasEnabledCallbacks()).isTrue()

    activity.onBackPressedDispatcher.onBackPressed()

    assertThat(activity.delegatedBackPressCount).isEqualTo(1)
    assertThat(activity.isFinishing).isFalse()
    assertThat(activity.onBackPressedDispatcher.hasEnabledCallbacks()).isTrue()
  }

  @Test
  @Config(sdk = [33, 34, 35])
  fun targetSdk36_backNotHandledByJs_finishesActivity() {
    val activity = createActivity(targetSdkVersion = 36, handledByJs = false)

    activity.onBackPressedDispatcher.onBackPressed()

    assertThat(activity.delegatedBackPressCount).isEqualTo(1)
    assertThat(activity.isFinishing).isTrue()
  }

  @Test
  @Config(sdk = [33, 35])
  fun targetSdk35_doesNotRegisterCallback() {
    val activity = createActivity(targetSdkVersion = 35, handledByJs = true)

    assertThat(activity.onBackPressedDispatcher.hasEnabledCallbacks()).isFalse()
  }

  private fun createActivity(targetSdkVersion: Int, handledByJs: Boolean): TestReactActivity {
    RuntimeEnvironment.getApplication().applicationInfo.targetSdkVersion = targetSdkVersion
    val activity = Robolectric.buildActivity(TestReactActivity::class.java).create().start().get()
    activity.handledByJs = handledByJs
    return activity
  }

  class TestReactActivity : ReactActivity() {
    var delegatedBackPressCount: Int = 0
    var handledByJs: Boolean = true

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        object : ReactActivityDelegate(this, "Test") {
          override fun onCreate(savedInstanceState: Bundle?) = Unit

          override fun onBackPressed(): Boolean {
            delegatedBackPressCount++
            return handledByJs
          }
        }
  }
}
