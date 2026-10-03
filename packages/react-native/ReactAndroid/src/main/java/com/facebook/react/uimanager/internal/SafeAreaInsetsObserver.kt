/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.internal

import android.graphics.Rect
import android.view.View
import android.view.ViewTreeObserver
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.R
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.SafeAreaInsetsChangeEvent
import kotlin.math.max
import kotlin.math.min

/**
 * Observes the part of a view that is covered by the system UI, and emits
 * [SafeAreaInsetsChangeEvent] whenever it changes.
 */
internal class SafeAreaInsetsObserver private constructor(private val view: View) :
    ViewTreeObserver.OnPreDrawListener, View.OnAttachStateChangeListener {

  private val visibleRect = Rect()
  private val insets = IntArray(4)
  private val lastInsets = IntArray(4)

  private var hasLastInsets = false
  private var isListening = false

  private fun start() {
    view.addOnAttachStateChangeListener(this)
    if (view.isAttachedToWindow) {
      onViewAttachedToWindow(view)
    }
  }

  private fun stop() {
    view.removeOnAttachStateChangeListener(this)
    stopListening()
    hasLastInsets = false
  }

  private fun startListening() {
    if (!isListening) {
      isListening = true
      view.viewTreeObserver.addOnPreDrawListener(this)
    }
  }

  private fun stopListening() {
    if (isListening) {
      isListening = false
      view.viewTreeObserver.removeOnPreDrawListener(this)
    }
  }

  override fun onViewAttachedToWindow(v: View) {
    // The insets depend on where the view ends up in the window, which is only known once it has
    // been laid out. A pre-draw listener is the cheapest hook that catches every
    // change: window insets, layout, and scrolling ancestors alike. The first emit waits for it
    // too: this can run from the prop setter, inside the mount transaction, where synchronously
    // re-entering React is not safe.
    startListening()
    view.invalidate()
  }

  override fun onViewDetachedFromWindow(v: View) {
    stopListening()
  }

  override fun onPreDraw(): Boolean {
    maybeEmit()
    return true
  }

  private fun maybeEmit() {
    // Emitting on anything but an inset change would loop: the synchronous
    // render an event causes produces a new frame, which runs this listener
    // again.
    if (!computeSafeAreaInsets(view, visibleRect, insets)) {
      return
    }
    if (hasLastInsets && insets.contentEquals(lastInsets)) {
      return
    }
    val eventDispatcher =
        UIManagerHelper.getEventDispatcher(UIManagerHelper.getReactContext(view)) ?: return
    // Recorded only once the event is actually dispatched, so a failed lookup
    // above does not permanently swallow this inset value.
    insets.copyInto(lastInsets)
    hasLastInsets = true
    eventDispatcher.dispatchEvent(
        SafeAreaInsetsChangeEvent(
            surfaceId = UIManagerHelper.getSurfaceId(view),
            viewTag = view.id,
            insetTop = insets[TOP],
            insetRight = insets[RIGHT],
            insetBottom = insets[BOTTOM],
            insetLeft = insets[LEFT],
        ),
    )
  }

  companion object {
    private const val TOP = 0
    private const val RIGHT = 1
    private const val BOTTOM = 2
    private const val LEFT = 3

    // One observer per view that sets the prop; views without it pay nothing.
    @JvmStatic
    fun setEnabled(view: View, enabled: Boolean) {
      val existing = view.getTag(R.id.safe_area_insets_observer) as? SafeAreaInsetsObserver
      if (enabled == (existing != null)) {
        return
      }
      if (enabled) {
        val observer = SafeAreaInsetsObserver(view)
        view.setTag(R.id.safe_area_insets_observer, observer)
        observer.start()
      } else {
        view.setTag(R.id.safe_area_insets_observer, null)
        existing?.stop()
      }
    }

    /**
     * The insets of the window that overlap [view], in the view's own coordinate space. A view that
     * does not reach under the system UI has no insets.
     */
    @JvmStatic
    fun getSafeAreaInsets(view: View): Insets? {
      val insets = IntArray(4)
      if (!computeSafeAreaInsets(view, Rect(), insets)) {
        return null
      }
      return Insets.of(insets[LEFT], insets[TOP], insets[RIGHT], insets[BOTTOM])
    }

    /**
     * Writes the insets of [view] into [out], ordered [TOP], [RIGHT], [BOTTOM], [LEFT], using
     * [visibleRect] as scratch space. Returns false when they cannot be computed, leaving [out]
     * untouched.
     */
    private fun computeSafeAreaInsets(view: View, visibleRect: Rect, out: IntArray): Boolean {
      if (view.width == 0 || view.height == 0) {
        return false
      }
      val rootView = view.rootView
      val windowInsets =
          ViewCompat.getRootWindowInsets(rootView)
              ?.getInsets(
                  WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout(),
              ) ?: return false

      if (!view.getGlobalVisibleRect(visibleRect)) {
        // The view is fully clipped by an ancestor (e.g. scrolled out of a
        // scroll view); the rect is undefined in that case, and a view that is
        // not visible has no meaningful insets.
        return false
      }
      out[TOP] = max(windowInsets.top - visibleRect.top, 0)
      out[RIGHT] =
          max(min(visibleRect.left + view.width - rootView.width, 0) + windowInsets.right, 0)
      out[BOTTOM] =
          max(min(visibleRect.top + view.height - rootView.height, 0) + windowInsets.bottom, 0)
      out[LEFT] = max(windowInsets.left - visibleRect.left, 0)
      return true
    }
  }
}
