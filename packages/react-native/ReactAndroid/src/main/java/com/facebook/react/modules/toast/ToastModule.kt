/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.toast

import android.view.Gravity
import android.widget.Toast
import com.facebook.fbreact.specs.NativeToastAndroidSpec
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.module.annotations.ReactModule

/** [NativeModule] that allows JS to show an Android Toast. */
@ReactModule(name = NativeToastAndroidSpec.NAME)
internal class ToastModule(reactContext: ReactApplicationContext) :
    NativeToastAndroidSpec(reactContext) {

  override fun getTypedExportedConstants(): Map<String, Any> =
      mutableMapOf(
          DURATION_SHORT_KEY to Toast.LENGTH_SHORT,
          DURATION_LONG_KEY to Toast.LENGTH_LONG,
          GRAVITY_TOP_KEY to (Gravity.TOP or Gravity.CENTER_HORIZONTAL),
          GRAVITY_BOTTOM_KEY to (Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL),
          GRAVITY_CENTER to (Gravity.CENTER_HORIZONTAL or Gravity.CENTER_VERTICAL),
      )

  override fun show(message: String?, durationDouble: Double) {
    val duration = durationDouble.toInt()
    UiThreadUtil.runOnUiThread { Toast.makeText(reactApplicationContext, message, duration).show() }
  }

  override fun showWithGravity(message: String?, durationDouble: Double, gravityDouble: Double) {
    val duration = durationDouble.toInt()
    val gravity = gravityDouble.toInt()
    UiThreadUtil.runOnUiThread {
      val toast = Toast.makeText(reactApplicationContext, message, duration)
      toast.setGravity(gravity, 0, 0)
      toast.show()
    }
  }

  override fun showWithGravityAndOffset(
      message: String?,
      durationDouble: Double,
      gravityDouble: Double,
      xOffsetDouble: Double,
      yOffsetDouble: Double,
  ) {
    val duration = durationDouble.toInt()
    val gravity = gravityDouble.toInt()
    val xOffset = xOffsetDouble.toInt()
    val yOffset = yOffsetDouble.toInt()
    UiThreadUtil.runOnUiThread {
      val toast = Toast.makeText(reactApplicationContext, message, duration)
      toast.setGravity(gravity, xOffset, yOffset)
      toast.show()
    }
  }

  companion object {
    const val NAME: String = NativeToastAndroidSpec.NAME
    private const val DURATION_SHORT_KEY = "SHORT"
    private const val DURATION_LONG_KEY = "LONG"
    private const val GRAVITY_TOP_KEY = "TOP"
    private const val GRAVITY_BOTTOM_KEY = "BOTTOM"
    private const val GRAVITY_CENTER = "CENTER"
  }
}
