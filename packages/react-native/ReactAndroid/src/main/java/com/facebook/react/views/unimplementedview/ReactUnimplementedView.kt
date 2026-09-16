/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.unimplementedview

import android.content.Context
import android.graphics.Color
import android.view.Gravity
import android.widget.LinearLayout
import androidx.appcompat.widget.AppCompatTextView
import com.facebook.react.bridge.ReactNoCrashSoftException
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.common.build.ReactBuildConfig

internal class ReactUnimplementedView(context: Context) : LinearLayout(context) {

  private val textView: AppCompatTextView = AppCompatTextView(context)
  private var lastName: String? = null

  init {
    textView.layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.MATCH_PARENT)
    textView.gravity = Gravity.CENTER
    textView.setTextColor(Color.WHITE)
    textView.text = ""

    if (ReactBuildConfig.DEBUG) {
      setBackgroundColor(0x55ff0000)
    }
    gravity = Gravity.CENTER_HORIZONTAL
    orientation = VERTICAL
    addView(textView)
  }

  internal fun setName(name: String) {
    // @ReactProp setters are invoked on every prop update, not only on change. Gate on
    // an actual name change to mirror the iOS Fabric path (which only logs when
    // oldProps.componentName != newProps.componentName) and avoid soft-exception spam
    // from re-renders or recycled view instances.
    if (name == lastName) {
      return
    }
    lastName = name

    if (ReactBuildConfig.DEBUG) {
      textView.text = "'$name' is not registered."
    }

    // Skip empty names — these come from the initial prop-default pass before the real
    // component name is set, and would produce noisy "''" entries in dashboards.
    if (name.isEmpty()) {
      return
    }

    // Log in all builds so missing components are reported in production.
    ReactSoftExceptionLogger.logSoftException(
        TAG,
        ReactNoCrashSoftException(
            "UnimplementedView: native component '$name' is not registered. " +
                "Ensure the native library defines a ViewManager for this component.",
        ),
    )
  }

  companion object {
    private const val TAG = "ReactUnimplementedView"
  }
}
