/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.predictiveback

import android.view.View
import com.facebook.react.PredictiveBackEvent
import com.facebook.react.PredictiveBackProgressListener
import com.facebook.react.ReactActivity
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper

/**
 * Zero-size host view that re-emits predictive-back progress as a Fabric direct event so {@code
 * Animated.event} (native driver) and Reanimated {@code useEvent} can drive UI-thread animations.
 */
internal class ReactPredictiveBackAnimatedView(private val reactContext: ThemedReactContext) :
    View(reactContext), PredictiveBackProgressListener {

  init {
    importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
    isClickable = false
    isFocusable = false
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    (reactContext.currentActivity as? ReactActivity)?.addPredictiveBackProgressListener(this)
  }

  override fun onDetachedFromWindow() {
    (reactContext.currentActivity as? ReactActivity)?.removePredictiveBackProgressListener(this)
    super.onDetachedFromWindow()
  }

  override fun onPredictiveBackProgress(event: PredictiveBackEvent, phase: Int) {
    if (id == NO_ID) {
      return
    }
    val dispatcher = UIManagerHelper.getEventDispatcher(reactContext) ?: return
    dispatcher.dispatchEvent(
        PredictiveBackProgressEvent(UIManagerHelper.getSurfaceId(this), id, event, phase),
    )
  }
}
