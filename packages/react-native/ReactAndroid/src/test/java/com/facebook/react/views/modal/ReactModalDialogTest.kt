/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.modal

import android.app.Activity
import android.view.KeyEvent
import androidx.activity.OnBackPressedCallback
import com.facebook.react.R
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner

/**
 * Regression test for issue #56411: pressing the hardware ESCAPE key on Android must invoke the
 * `onRequestClose` flow on a Modal. The fix routes KEYCODE_ESCAPE through the dialog's
 * [androidx.activity.OnBackPressedDispatcher] from inside [ReactModalHostView.ReactModalDialog],
 * which guarantees a single dispatch path consistent with KEYCODE_BACK.
 *
 * Robolectric cannot exercise device-level key dispatch end-to-end, so this test verifies the
 * dispatcher contract: a registered [OnBackPressedCallback] fires when an ESCAPE ACTION_UP key
 * event is dispatched to the dialog, and other key events fall through unchanged.
 */
@RunWith(RobolectricTestRunner::class)
class ReactModalDialogTest {

  private lateinit var activity: Activity

  @Before
  fun setUp() {
    activity = Robolectric.buildActivity(Activity::class.java).create().get()
  }

  @Test
  fun `escape key up dispatches through onBackPressedDispatcher`() {
    val dialog =
        ReactModalHostView.ReactModalDialog(activity, R.style.Theme_FullScreenDialog)
    var backPressedCount = 0
    dialog.onBackPressedDispatcher.addCallback(
        object : OnBackPressedCallback(true) {
          override fun handleOnBackPressed() {
            backPressedCount++
          }
        }
    )

    val handled =
        dialog.dispatchKeyEvent(KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_ESCAPE))

    assertThat(handled).isTrue()
    assertThat(backPressedCount).isEqualTo(1)
  }

  @Test
  fun `escape key down does not trigger onBackPressedDispatcher`() {
    val dialog =
        ReactModalHostView.ReactModalDialog(activity, R.style.Theme_FullScreenDialog)
    var backPressedCount = 0
    dialog.onBackPressedDispatcher.addCallback(
        object : OnBackPressedCallback(true) {
          override fun handleOnBackPressed() {
            backPressedCount++
          }
        }
    )

    // Only ACTION_UP should consume; ACTION_DOWN must fall through to super so the platform's
    // existing key-dispatch lifecycle (long-press, repeat, etc.) is not disturbed.
    dialog.dispatchKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ESCAPE))

    assertThat(backPressedCount).isEqualTo(0)
  }

  @Test
  fun `non-escape keys are delegated to super dispatchKeyEvent`() {
    val dialog =
        ReactModalHostView.ReactModalDialog(activity, R.style.Theme_FullScreenDialog)
    var backPressedCount = 0
    dialog.onBackPressedDispatcher.addCallback(
        object : OnBackPressedCallback(true) {
          override fun handleOnBackPressed() {
            backPressedCount++
          }
        }
    )

    // An arbitrary letter key must not be intercepted by the ESC override.
    dialog.dispatchKeyEvent(KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_A))

    assertThat(backPressedCount).isEqualTo(0)
  }
}
