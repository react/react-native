/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.safeareaprovider

import android.content.Context
import android.view.ViewGroup
import android.view.ViewTreeObserver
import com.facebook.react.views.view.ReactViewGroup

internal typealias OnInsetsChangeHandler =
    (view: ReactSafeAreaProvider, insets: EdgeInsets, frame: Rect) -> Unit

/**
 * Native view backing `SafeAreaProvider`. It measures the safe area insets and its own frame and
 * reports them to JS via [InsetsChangeEvent] whenever they change. Measurement is driven off the
 * view lifecycle: it is computed on attach and on every pre-draw pass.
 */
internal class ReactSafeAreaProvider(context: Context?) :
    ReactViewGroup(context), ViewTreeObserver.OnPreDrawListener {
  private var insetsChangeHandler: OnInsetsChangeHandler? = null
  private var lastInsets: EdgeInsets? = null
  private var lastFrame: Rect? = null

  private fun maybeUpdateInsets() {
    val handler = insetsChangeHandler ?: return
    val edgeInsets = getSafeAreaInsets(this) ?: return
    val frame = getFrame(rootView as ViewGroup, this) ?: return
    if (lastInsets != edgeInsets || lastFrame != frame) {
      handler(this, edgeInsets, frame)
      lastInsets = edgeInsets
      lastFrame = frame
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    viewTreeObserver.addOnPreDrawListener(this)
    maybeUpdateInsets()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    viewTreeObserver.removeOnPreDrawListener(this)
  }

  override fun onPreDraw(): Boolean {
    maybeUpdateInsets()
    return true
  }

  fun setOnInsetsChangeHandler(handler: OnInsetsChangeHandler?) {
    insetsChangeHandler = handler
    maybeUpdateInsets()
  }
}
