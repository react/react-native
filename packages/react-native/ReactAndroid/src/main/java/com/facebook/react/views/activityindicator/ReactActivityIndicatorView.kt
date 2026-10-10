/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.activityindicator

import android.content.Context
import android.graphics.PorterDuff
import android.view.ViewGroup
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.FrameLayout
import android.widget.ProgressBar
import com.facebook.react.R

/**
 * Wraps an indeterminate [ProgressBar], so the [ProgressBar] can be hidden while the container
 * keeps its background and other view props.
 */
internal class ReactActivityIndicatorView(context: Context) : FrameLayout(context) {

  internal var color: Int? = null
  internal var animating = true

  private val progressBar =
      ProgressBar(context, null, android.R.attr.progressBarStyle).apply { isIndeterminate = true }

  init {
    addView(
        progressBar,
        ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT,
        ),
    )
  }

  override fun onInitializeAccessibilityNodeInfo(info: AccessibilityNodeInfo) {
    super.onInitializeAccessibilityNodeInfo(info)

    val testId = getTag(R.id.react_test_id) as String?
    if (testId != null) {
      info.viewIdResourceName = testId
    }
  }

  internal fun apply() {
    val drawable = progressBar.indeterminateDrawable
    if (drawable != null) {
      @Suppress("DEPRECATION")
      color?.let { drawable.setColorFilter(it, PorterDuff.Mode.SRC_IN) }
          ?: drawable.clearColorFilter()
    }
    progressBar.visibility = if (animating) VISIBLE else INVISIBLE
  }
}
