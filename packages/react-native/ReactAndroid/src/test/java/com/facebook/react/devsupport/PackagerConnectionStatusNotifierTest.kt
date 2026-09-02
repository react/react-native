/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

class PackagerConnectionStatusNotifierTest {

  private val devLoadingViewManager = RecordingDevLoadingViewManager()
  private val delayedActions = mutableListOf<Runnable>()
  private val notifier =
      PackagerConnectionStatusNotifier({ devLoadingViewManager }) { runnable, _ ->
        delayedActions.add(runnable)
      }

  @Test
  fun testInitialConnectionDoesNotShowReconnectedMessage() {
    notifier.onPackagerConnected()

    assertThat(devLoadingViewManager.messages).isEmpty()
  }

  @Test
  fun testLostConnectionShowsRetryingOnceUntilReconnect() {
    notifier.onPackagerConnected()

    notifier.onPackagerDisconnected()
    notifier.onPackagerDisconnected()

    assertThat(devLoadingViewManager.messages)
        .containsExactly("Connection to Metro lost. Retrying...")
  }

  @Test
  fun testReconnectAfterLossShowsReconnectedMessage() {
    notifier.onPackagerConnected()
    notifier.onPackagerDisconnected()

    notifier.onPackagerConnected()

    assertThat(devLoadingViewManager.messages)
        .containsExactly("Connection to Metro lost. Retrying...", "Reconnected to Metro.")
  }

  @Test
  fun testReconnectMessageIsHiddenAfterDelay() {
    notifier.onPackagerConnected()
    notifier.onPackagerDisconnected()

    notifier.onPackagerConnected()
    delayedActions.single().run()

    assertThat(devLoadingViewManager.hideCount).isEqualTo(1)
  }

  @Test
  fun testReconnectMessageDelayDoesNotHideNewLostConnectionMessage() {
    notifier.onPackagerConnected()
    notifier.onPackagerDisconnected()
    notifier.onPackagerConnected()

    notifier.onPackagerDisconnected()
    delayedActions.single().run()

    assertThat(devLoadingViewManager.hideCount).isEqualTo(0)
  }

  @Test
  fun testIntentionalCloseDoesNotShowConnectionLostMessage() {
    notifier.onPackagerConnected()

    notifier.onPackagerConnectionClosed()
    notifier.onPackagerDisconnected()

    assertThat(devLoadingViewManager.messages).isEmpty()
  }

  @Test
  fun testUsesCurrentDevLoadingViewManager() {
    var currentDevLoadingViewManager: RecordingDevLoadingViewManager? = null
    val notifier =
        PackagerConnectionStatusNotifier({ currentDevLoadingViewManager }) { runnable, _ ->
          delayedActions.add(runnable)
        }
    currentDevLoadingViewManager = RecordingDevLoadingViewManager()

    notifier.onPackagerConnected()
    notifier.onPackagerDisconnected()

    assertThat(currentDevLoadingViewManager.messages)
        .containsExactly("Connection to Metro lost. Retrying...")
  }

  private class RecordingDevLoadingViewManager : DevLoadingViewManager {
    val messages = mutableListOf<String>()
    var hideCount = 0

    override fun showMessage(message: String) {
      messages.add(message)
    }

    override fun showMessage(
        message: String,
        color: Double?,
        backgroundColor: Double?,
        dismissButton: Boolean?,
    ) {
      messages.add(message)
    }

    override fun updateProgress(status: String?, done: Int?, total: Int?, percent: Int?) = Unit

    override fun hide() {
      hideCount++
    }
  }
}
