/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.os.Handler
import android.os.Looper
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager

internal class PackagerConnectionStatusNotifier(
    private val devLoadingViewManagerProvider: () -> DevLoadingViewManager?,
    private val postDelayed: (Runnable, Long) -> Unit = { runnable, delayMs ->
      Handler(Looper.getMainLooper()).postDelayed(runnable, delayMs)
    },
) {
  private var hasConnected = false
  private var connectionLost = false
  private var reconnectMessageToken = 0

  fun onPackagerConnected() {
    if (connectionLost) {
      val devLoadingViewManager = devLoadingViewManagerProvider()
      devLoadingViewManager?.showMessage(RECONNECTED_MESSAGE)
      if (devLoadingViewManager != null) {
        val token = ++reconnectMessageToken
        postDelayed(
            Runnable {
              if (!connectionLost && reconnectMessageToken == token) {
                devLoadingViewManager.hide()
              }
            },
            RECONNECTED_MESSAGE_HIDE_DELAY_MS,
        )
      }
    }
    hasConnected = true
    connectionLost = false
  }

  fun onPackagerDisconnected() {
    if (hasConnected && !connectionLost) {
      connectionLost = true
      reconnectMessageToken++
      devLoadingViewManagerProvider()?.showMessage(CONNECTION_LOST_MESSAGE)
    }
  }

  fun onPackagerConnectionClosed() {
    hasConnected = false
    connectionLost = false
    reconnectMessageToken++
  }

  private companion object {
    const val CONNECTION_LOST_MESSAGE = "Connection to Metro lost. Retrying..."
    const val RECONNECTED_MESSAGE = "Reconnected to Metro."
    const val RECONNECTED_MESSAGE_HIDE_DELAY_MS = 2_000L
  }
}
