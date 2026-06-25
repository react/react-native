/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.app.Activity
import android.view.View
import android.view.ViewGroup
import com.facebook.infer.annotation.Assertions
import com.facebook.react.common.SurfaceDelegate
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.util.RNLog.e

/**
 * The implementation of SurfaceDelegate with [Activity]. This is the default SurfaceDelegate for
 * Mobile.
 */
internal class LogBoxDialogSurfaceDelegate(private val devSupportManager: DevSupportManager) :
    SurfaceDelegate {
  private var reactRootView: View? = null
  private var dialog: LogBoxDialog? = null

  override fun createContentView(appKey: String) {
    Assertions.assertCondition(
        appKey == "LogBox",
        "This surface manager can only create LogBox React application",
    )
    reactRootView = devSupportManager.createRootView("LogBox")
    if (reactRootView == null) {
      e("Unable to launch logbox because react was unable to create the root view")
    }
  }

  override fun isContentViewReady(): Boolean = reactRootView != null

  override fun destroyContentView() {
    if (reactRootView != null) {
      devSupportManager.destroyRootView(reactRootView)
      reactRootView = null
    }
  }

  override fun show() {
    if (isShowing()) {
      return
    }
    val context = devSupportManager.currentActivity
    if (context == null || context.isFinishing) {
      e(
          "Unable to launch logbox because react activity " +
              "is not available, here is the error that logbox would've displayed: "
      )
      return
    }

    if (!isContentViewReady()) {
      createContentView("LogBox")
    }
    if (!isContentViewReady()) {
      return
    }

    dialog = LogBoxDialog(context, reactRootView)
    dialog?.let { dialog ->
      dialog.setCancelable(true)
      dialog.setCanceledOnTouchOutside(false)
      dialog.setOnCancelListener {
        devSupportManager.currentReactContext?.emitDeviceEvent("hardwareBackPress")
      }
      dialog.show()
    }
  }

  override fun hide() {
    if (isShowing()) {
      dialog?.dismiss()
    }
    (reactRootView?.parent as ViewGroup?)?.removeView(reactRootView)
    dialog = null
    destroyContentView()
  }

  override fun isShowing(): Boolean = dialog?.isShowing ?: false
}
