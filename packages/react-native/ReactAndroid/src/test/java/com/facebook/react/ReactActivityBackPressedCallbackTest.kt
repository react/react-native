/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ReactActivityBackPressedCallbackTest {

  @Test
  fun getBackPressedCallback_isEnabledByDefault() {
    val activity = Robolectric.buildActivity(TestReactActivity::class.java).get()

    assertThat(activity.backPressedCallback.isEnabled).isTrue()
  }

  @Test
  fun invokeDefaultOnBackPressed_restoresDisabledState() {
    val activity = Robolectric.buildActivity(TestReactActivity::class.java).get()
    activity.backPressedCallback.isEnabled = false

    activity.invokeDefaultOnBackPressed()

    assertThat(activity.backPressedCallback.isEnabled).isFalse()
  }

  @Test
  fun invokeDefaultOnBackPressed_restoresEnabledState() {
    val activity = Robolectric.buildActivity(TestReactActivity::class.java).get()

    activity.invokeDefaultOnBackPressed()

    assertThat(activity.backPressedCallback.isEnabled).isTrue()
  }

  @Test
  fun systemNavigationObserver_notifiesJsWhenCallbackDisabled() {
    val activity = Robolectric.buildActivity(TestReactActivity::class.java).get()
    activity.backPressedCallback.isEnabled = false

    activity.onSystemNavigationBackInvoked()

    assertThat(activity.delegatedBackPressCount).isEqualTo(1)
  }

  @Test
  fun systemNavigationObserver_doesNotNotifyJsWhenCallbackEnabled() {
    val activity = Robolectric.buildActivity(TestReactActivity::class.java).get()

    activity.onSystemNavigationBackInvoked()

    assertThat(activity.delegatedBackPressCount).isEqualTo(0)
  }

  @Test
  fun setInterceptEnabled_true_enablesCallbackBelowApi36() {
    val activity = Robolectric.buildActivity(TestReactActivity::class.java).get()
    activity.backPressedCallback.isEnabled = false

    activity.setInterceptEnabled(true)

    assertThat(activity.backPressedCallback.isEnabled).isTrue()
  }

  @Test
  fun setInterceptEnabled_false_disablesCallbackBelowApi36() {
    val activity = Robolectric.buildActivity(TestReactActivity::class.java).get()

    activity.setInterceptEnabled(false)

    assertThat(activity.backPressedCallback.isEnabled).isFalse()
  }

  @Test
  fun addPredictiveBackHandler_enablesCallbackWhenInterceptDisabled() {
    val activity = Robolectric.buildActivity(TestReactActivity::class.java).get()
    activity.setInterceptEnabled(false)

    activity.addPredictiveBackHandler(NoOpPredictiveBackHandler())

    assertThat(activity.backPressedCallback.isEnabled).isTrue()
  }

  @Test
  fun removePredictiveBackHandler_disablesCallbackWhenInterceptDisabled() {
    val activity = Robolectric.buildActivity(TestReactActivity::class.java).get()
    activity.setInterceptEnabled(false)
    val handler = NoOpPredictiveBackHandler()
    activity.addPredictiveBackHandler(handler)

    activity.removePredictiveBackHandler(handler)

    assertThat(activity.backPressedCallback.isEnabled).isFalse()
  }

  @Test
  fun nativeHandler_receivesStartAndProgress() {
    val activity = Robolectric.buildActivity(TestReactActivity::class.java).get()
    val handler = RecordingPredictiveBackHandler()
    activity.addPredictiveBackHandler(handler)
    val event = PredictiveBackEvent(0.4f, PredictiveBackEvent.EDGE_LEFT, 12f, 40f)

    activity.dispatchPredictiveBackStarted(event)
    activity.dispatchPredictiveBackProgressed(event)

    assertThat(handler.started).containsExactly(event)
    assertThat(handler.progressed).containsExactly(event)
  }

  @Test
  fun finishPredictiveBackCommit_skipsJsWhenNativeHandlerConsumes() {
    val activity = Robolectric.buildActivity(TestReactActivity::class.java).get()
    activity.addPredictiveBackHandler(NoOpPredictiveBackHandler(consumeCommit = true))

    activity.finishPredictiveBackCommit()

    assertThat(activity.delegatedBackPressCount).isEqualTo(0)
  }

  @Test
  fun finishPredictiveBackCommit_notifiesJsWhenNoHandlerConsumes() {
    val activity = Robolectric.buildActivity(TestReactActivity::class.java).get()

    activity.finishPredictiveBackCommit()

    assertThat(activity.delegatedBackPressCount).isEqualTo(1)
  }

  @Test
  fun progressListener_doesNotEnableCallbackWhenInterceptDisabled() {
    val activity = Robolectric.buildActivity(TestReactActivity::class.java).get()
    activity.setInterceptEnabled(false)

    activity.addPredictiveBackProgressListener { _, _ -> }

    assertThat(activity.backPressedCallback.isEnabled).isFalse()
  }

  @Test
  fun progressListener_receivesStartAndProgress() {
    val activity = Robolectric.buildActivity(TestReactActivity::class.java).get()
    val phases = mutableListOf<Int>()
    activity.addPredictiveBackProgressListener { _, phase -> phases.add(phase) }
    val event = PredictiveBackEvent(0.4f, PredictiveBackEvent.EDGE_LEFT, 12f, 40f)

    activity.dispatchPredictiveBackStarted(event)
    activity.dispatchPredictiveBackProgressed(event)

    assertThat(phases)
        .containsExactly(PredictiveBackEvent.PHASE_START, PredictiveBackEvent.PHASE_PROGRESS)
  }

  private open class NoOpPredictiveBackHandler(
      private val consumeCommit: Boolean = false,
  ) : PredictiveBackHandler {
    override fun onPredictiveBackStarted(event: PredictiveBackEvent) = Unit

    override fun onPredictiveBackProgressed(event: PredictiveBackEvent) = Unit

    override fun onPredictiveBackCancelled() = Unit

    override fun onPredictiveBackCommitted(): Boolean = consumeCommit
  }

  private class RecordingPredictiveBackHandler : NoOpPredictiveBackHandler() {
    val started = mutableListOf<PredictiveBackEvent>()
    val progressed = mutableListOf<PredictiveBackEvent>()

    override fun onPredictiveBackStarted(event: PredictiveBackEvent) {
      started.add(event)
    }

    override fun onPredictiveBackProgressed(event: PredictiveBackEvent) {
      progressed.add(event)
    }
  }

  class TestReactActivity : ReactActivity() {
    var delegatedBackPressCount: Int = 0

    override fun getMainComponentName(): String = "Test"

    override fun createReactActivityDelegate(): ReactActivityDelegate {
      return object : ReactActivityDelegate(this, "Test") {
        override fun onBackPressed(): Boolean {
          delegatedBackPressCount++
          return true
        }
      }
    }
  }
}
