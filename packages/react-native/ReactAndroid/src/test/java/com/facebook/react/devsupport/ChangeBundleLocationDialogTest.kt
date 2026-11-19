/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.app.Activity
import android.content.Context
import android.view.View
import android.view.View.MeasureSpec
import android.view.ViewGroup
import android.widget.Button
import android.widget.ScrollView
import com.facebook.react.R
import com.facebook.react.modules.debug.interfaces.DeveloperSettings
import com.facebook.react.packagerconnection.PackagerConnectionSettings
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowAlertDialog

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35], qualifiers = "w753dp-h423dp-land")
class ChangeBundleLocationDialogTest {

  @Test
  fun testLandscapeDialogContentIsScrollableAndActionsRemainReachable() {
    val activity = Robolectric.buildActivity(Activity::class.java).setup().get()

    ChangeBundleLocationDialog.show(activity, TestDeveloperSettings(activity)) {}

    val dialog = ShadowAlertDialog.getLatestAlertDialog()
    val customPanel = dialog.findViewById<ViewGroup>(android.R.id.custom)
    assertThat(customPanel).isNotNull

    val displayMetrics = activity.resources.displayMetrics
    val decorView = dialog.window!!.decorView
    decorView.measure(
        MeasureSpec.makeMeasureSpec(displayMetrics.widthPixels, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(displayMetrics.heightPixels, MeasureSpec.EXACTLY),
    )
    decorView.layout(0, 0, displayMetrics.widthPixels, displayMetrics.heightPixels)

    val scrollView = findScrollView(customPanel)
    assertThat(scrollView).isNotNull
    assertThat(scrollView!!.canScrollVertically(1)).isTrue

    val applyButton =
        findButtonWithText(
            scrollView,
            activity.getString(R.string.catalyst_change_bundle_location_apply),
        )
    val cancelButton =
        findButtonWithText(
            scrollView,
            activity.getString(R.string.catalyst_change_bundle_location_cancel),
        )
    assertThat(applyButton).isNotNull
    assertThat(cancelButton).isNotNull

    scrollView.scrollTo(0, scrollView.getChildAt(0).height - scrollView.height)

    assertThat(scrollView.scrollY).isGreaterThan(0)
    assertThat(applyButton!!.top).isGreaterThanOrEqualTo(scrollView.scrollY)
    assertThat(cancelButton!!.bottom).isLessThanOrEqualTo(scrollView.scrollY + scrollView.height)
  }

  private fun findScrollView(view: View): ScrollView? {
    if (view is ScrollView) {
      return view
    }
    if (view !is ViewGroup) {
      return null
    }
    for (index in 0 until view.childCount) {
      findScrollView(view.getChildAt(index))?.let {
        return it
      }
    }
    return null
  }

  private fun findButtonWithText(view: View, text: String): Button? {
    if (view is Button && view.text.toString() == text) {
      return view
    }
    if (view !is ViewGroup) {
      return null
    }
    for (index in 0 until view.childCount) {
      findButtonWithText(view.getChildAt(index), text)?.let {
        return it
      }
    }
    return null
  }

  private class TestDeveloperSettings(context: Context) : DeveloperSettings {
    override val packagerConnectionSettings = PackagerConnectionSettings(context)
    override var isFpsDebugEnabled = false
    override var isAnimationFpsDebugEnabled = false
    override var isJSDevModeEnabled = true
    override var isJSMinifyEnabled = false
    override var isElementInspectorEnabled = false
    override var isDeviceDebugEnabled = false
    override var isHotModuleReplacementEnabled = true

    override fun addMenuItem(title: String) = Unit
  }
}
