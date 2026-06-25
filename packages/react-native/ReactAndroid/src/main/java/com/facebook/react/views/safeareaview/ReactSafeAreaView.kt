/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.safeareaview

import android.view.ViewGroup
import androidx.annotation.UiThread
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsCompat.CONSUMED
import com.facebook.react.bridge.GuardedRunnable
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext

internal class ReactSafeAreaView(val reactContext: ThemedReactContext) : ViewGroup(reactContext) {
  internal var stateWrapper: StateWrapper? = null

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()

    ViewCompat.setOnApplyWindowInsetsListener(this) { _, windowInsets ->
      val insets =
          windowInsets.getInsets(
              WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
          )
      updateState(insets)
      CONSUMED
    }
    requestApplyInsets()
  }

  override fun onLayout(p0: Boolean, p1: Int, p2: Int, p3: Int, p4: Int): Unit = Unit

  override fun shouldDelayChildPressedState(): Boolean = false

  @Suppress("DEPRECATION")
  @UiThread
  private fun updateState(insets: Insets) {
    val sw = stateWrapper
    if (sw != null) {
      WritableNativeMap().apply {
        putDouble("left", insets.left.toFloat().pxToDp().toDouble())
        putDouble("top", insets.top.toFloat().pxToDp().toDouble())
        putDouble("bottom", insets.bottom.toFloat().pxToDp().toDouble())
        putDouble("right", insets.right.toFloat().pxToDp().toDouble())

        sw.updateState(this)
      }
    } else if (!ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE) {
      // paper
      reactContext.runOnNativeModulesQueueThread(
          object : GuardedRunnable(reactContext) {
            override fun runGuarded() {
              this@ReactSafeAreaView.reactContext.reactApplicationContext
                  .getNativeModule(com.facebook.react.uimanager.UIManagerModule::class.java)
                  ?.updateInsetsPadding(id, insets.top, insets.left, insets.bottom, insets.right)
            }
          }
      )
    }
  }
}
