/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp

import android.content.res.Configuration
import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.widget.FrameLayout
import androidx.core.graphics.drawable.toDrawable
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.FBRNTesterEndToEndHelper
import com.facebook.react.ReactActivity
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.devsupport.DevMenuConfiguration
import java.io.FileDescriptor
import java.io.PrintWriter

internal class RNTesterActivity : ReactActivity() {
  class RNTesterActivityDelegate(val activity: ReactActivity, mainComponentName: String) :
      DefaultReactActivityDelegate(activity, mainComponentName) {
    private val PARAM_ROUTE = "route"
    private lateinit var initialProps: Bundle

    override fun onCreate(savedInstanceState: Bundle?) {
      // Get remote param before calling super which uses it
      val bundle = activity.intent?.extras

      if (bundle != null && bundle.containsKey(PARAM_ROUTE)) {
        val routeUri = "rntester://example/${bundle.getString(PARAM_ROUTE)}Example"
        initialProps = Bundle().apply { putString("exampleFromAppetizeParams", routeUri) }
      }
      FBRNTesterEndToEndHelper.onCreate(activity.application)
      super.onCreate(savedInstanceState)
    }

    override fun getLaunchOptions() =
        if (this::initialProps.isInitialized) initialProps else Bundle()
  }

  // set background color so it will show below transparent system bars on forced edge-to-edge
  private fun maybeUpdateBackgroundColor() {
    val isDarkMode =
        resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK ==
            Configuration.UI_MODE_NIGHT_YES

    val color =
        if (isDarkMode) {
          Color.rgb(11, 6, 0)
        } else {
          Color.rgb(243, 248, 255)
        }

    window?.setBackgroundDrawable(color.toDrawable())
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    fullyDrawnReporter.addReporter()
    maybeUpdateBackgroundColor()

    reactDelegate?.reactHost?.let { reactHost ->
      val devMenuConfiguration = DevMenuConfiguration(
          devMenuEnabled = true,
          shakeGestureEnabled = true,
          keyboardShortcutsEnabled = true,
      )
      reactHost.setDevMenuConfiguration(devMenuConfiguration)
    }

    // register insets listener to update margins on the ReactRootView to avoid overlap w/ system
    // bars
    reactDelegate?.reactRootView?.let { rootView ->
      val insetsType: Int =
          WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()

      val windowInsetsListener = { view: View, windowInsets: WindowInsetsCompat ->
        val insets = windowInsets.getInsets(insetsType)

        (view.layoutParams as FrameLayout.LayoutParams).apply {
          setMargins(insets.left, insets.top, insets.right, insets.bottom)
        }

        WindowInsetsCompat.CONSUMED
      }
      ViewCompat.setOnApplyWindowInsetsListener(rootView, windowInsetsListener)
    }
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)

    // update background color on UI mode change
    maybeUpdateBackgroundColor()
  }

  override fun createReactActivityDelegate() = RNTesterActivityDelegate(this, mainComponentName)

  override fun getMainComponentName() = "RNTesterApp"

  override fun dump(
      prefix: String,
      fd: FileDescriptor?,
      writer: PrintWriter,
      args: Array<String>?,
  ) {
    FBRNTesterEndToEndHelper.maybeDump(prefix, writer, args)
  }
}
