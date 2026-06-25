/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.app.Activity
import android.app.Dialog
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.Window
import android.widget.FrameLayout
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.common.logging.FLog
import com.facebook.react.R
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.SurfaceDelegate
import com.facebook.react.devsupport.interfaces.DevSupportManager

/**
 * The implementation of SurfaceDelegate with [Activity]. This is the default [SurfaceDelegate] for
 * Mobile.
 */
internal class RedBoxDialogSurfaceDelegate(private val devSupportManager: DevSupportManager) :
    SurfaceDelegate {
  private val doubleTapReloadRecognizer = DoubleTapReloadRecognizer()

  private var dialog: Dialog? = null
  private var redBoxContentView: RedBoxContentView? = null

  override fun createContentView(appKey: String) {
    // The content view is created in android instead of using react app. Hence the appKey is not
    // used here.
    val redBoxHandler = devSupportManager.redBoxHandler
    val context = devSupportManager.currentActivity
    if (context == null || context.isFinishing) {
      val message = devSupportManager.lastErrorTitle
      FLog.e(
          ReactConstants.TAG,
          "Unable to launch redbox because react activity is not available, here is the error that redbox would've displayed: ${(message ?: "N/A")}",
      )
      return
    }

    // Create a new RedBox when currentActivity get updated
    redBoxContentView =
        RedBoxContentView(context, devSupportManager, redBoxHandler).also { it.init() }
  }

  override fun isContentViewReady(): Boolean = redBoxContentView != null

  override fun destroyContentView() {
    redBoxContentView = null
  }

  override fun show() {
    val message: String? = devSupportManager.lastErrorTitle
    val context: Activity? = devSupportManager.currentActivity
    if (context == null || context.isFinishing) {
      devSupportManager.currentReactContext?.let { reactContext ->
        /**
         * If the activity isn't available, try again after the next onHostResume(). onHostResume()
         * is when the activity gets attached to the react native.
         */
        runAfterHostResume(reactContext) { this.show() }
        return
      }
      FLog.e(
          ReactConstants.TAG,
          "Unable to launch redbox because react activity and react context is not available, here is the error that redbox would've displayed: ${message ?: "N/A"}",
      )
      return
    }

    if (redBoxContentView?.context !== context) {
      // Create a new RedBox when currentActivity get updated
      createContentView("RedBox")
    }

    redBoxContentView?.refreshContentView()
    if (dialog == null) {
      dialog =
          object : Dialog(context, R.style.Theme_Catalyst_RedBox) {
                override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
                  if (keyCode == KeyEvent.KEYCODE_MENU) {
                    devSupportManager.showDevOptionsDialog()
                    return true
                  }
                  if (doubleTapReloadRecognizer.didDoubleTapR(keyCode, currentFocus)) {
                    devSupportManager.handleReloadJS()
                  }
                  return super.onKeyUp(keyCode, event)
                }

                override fun onCreate(savedInstanceState: Bundle?) {
                  // set background color so it will show below transparent system bars on forced
                  // edge-to-edge
                  checkNotNull(window).setBackgroundDrawable(ColorDrawable(Color.BLACK))
                  // register insets listener to update margins on the ReactRootView to avoid
                  // overlap w/ system bars
                  val insetsType: Int =
                      WindowInsetsCompat.Type.systemBars() or
                          WindowInsetsCompat.Type.displayCutout()

                  ViewCompat.setOnApplyWindowInsetsListener(checkNotNull(redBoxContentView)) {
                      view: View,
                      windowInsetsCompat: WindowInsetsCompat ->
                    val insets: Insets = windowInsetsCompat.getInsets(insetsType)
                    val lp: FrameLayout.LayoutParams = view.layoutParams as FrameLayout.LayoutParams
                    lp.setMargins(insets.left, insets.top, insets.right, insets.bottom)
                    WindowInsetsCompat.CONSUMED
                  }
                }
              }
              .apply {
                requestWindowFeature(Window.FEATURE_NO_TITLE)
                setContentView(checkNotNull(redBoxContentView))
                setOnCancelListener { devSupportManager.hideRedboxDialog() }
              }
    }
    dialog?.show()
  }

  override fun hide() {
    try {
      // dismiss redbox if exists
      dialog?.dismiss()
    } catch (e: IllegalArgumentException) {
      FLog.e(ReactConstants.TAG, "RedBoxDialogSurfaceDelegate: error while dismissing dialog: ", e)
    }
    destroyContentView()
    dialog = null
  }

  override fun isShowing(): Boolean = dialog?.isShowing == true

  companion object {
    private fun runAfterHostResume(reactContext: ReactContext, runnable: Runnable) {
      reactContext.addLifecycleEventListener(
          object : LifecycleEventListener {
            override fun onHostResume() {
              runnable.run()
              reactContext.removeLifecycleEventListener(this)
            }

            override fun onHostPause() = Unit

            override fun onHostDestroy() = Unit
          }
      )
    }
  }
}
