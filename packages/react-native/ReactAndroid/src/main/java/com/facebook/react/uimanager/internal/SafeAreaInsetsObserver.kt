/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.internal

import android.graphics.Matrix
import android.graphics.Rect
import android.graphics.RectF
import android.view.View
import android.view.ViewTreeObserver
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.R
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.SafeAreaInsetsChangeEvent
import kotlin.math.abs
import kotlin.math.roundToInt

/**
 * Observes unsafe-area overlap of a view's rendered bounds and emits [SafeAreaInsetsChangeEvent].
 */
internal class SafeAreaInsetsObserver private constructor(private val view: View) :
    ViewTreeObserver.OnPreDrawListener, View.OnAttachStateChangeListener {

  private val geometry = Geometry()
  private val insets = FloatArray(4)
  private val lastInsets = FloatArray(4)

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
    hasLastInsets = false
  }

  override fun onPreDraw(): Boolean {
    maybeEmit()
    return true
  }

  private fun maybeEmit() {
    // Emitting on anything but an inset change would loop: the synchronous
    // render an event causes produces a new frame, which runs this listener
    // again.
    if (!computeSafeAreaInsets(view, geometry, insets)) {
      hasLastInsets = false
      return
    }
    if (
        hasLastInsets &&
            insets.indices.all { abs(insets[it] - lastInsets[it]) <= INSET_CHANGE_THRESHOLD_PX }
    ) {
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

  private class Geometry {
    val visibleRect = Rect()
    val toRoot = Matrix()
    val boundsRect = RectF()
    val matrixValues = FloatArray(9)
  }

  companion object {
    private const val TOP = 0
    private const val RIGHT = 1
    private const val BOTTOM = 2
    private const val LEFT = 3
    // Match iOS notification precision without rounding the emitted measurement.
    private const val INSET_CHANGE_THRESHOLD_PX = 1f
    // Bound accumulated transform round-off to one thousandth of a physical pixel.
    private const val MAX_AXIS_ALIGNMENT_ERROR_PX = 0.001f

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
     * Insets from [view]'s full transformed bounds to the window safe area, in window physical
     * pixels, rounded to integers. Ancestor clipping is only a visibility check, not a change to
     * those bounds. Returns null for empty/fully clipped views, missing window insets, or
     * unsupported transforms. The event preserves fractional pixels and converts them to dp.
     */
    @JvmStatic
    fun getSafeAreaInsets(view: View): Insets? {
      val insets = FloatArray(4)
      if (!computeSafeAreaInsets(view, Geometry(), insets)) {
        return null
      }
      return Insets.of(
          insets[LEFT].roundToInt(),
          insets[TOP].roundToInt(),
          insets[RIGHT].roundToInt(),
          insets[BOTTOM].roundToInt(),
      )
    }

    /**
     * Writes window physical-pixel insets into [out], ordered [TOP], [RIGHT], [BOTTOM], [LEFT].
     * Returns false when they cannot be computed, leaving [out] untouched.
     */
    private fun computeSafeAreaInsets(view: View, geometry: Geometry, out: FloatArray): Boolean {
      if (view.width <= 0 || view.height <= 0) {
        return false
      }
      val rootView = view.rootView
      if (rootView.width <= 0 || rootView.height <= 0) {
        return false
      }
      val windowInsets =
          ViewCompat.getRootWindowInsets(rootView)
              ?.getInsets(
                  WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout(),
              ) ?: return false

      if (!view.getGlobalVisibleRect(geometry.visibleRect)) {
        // The view is fully clipped by an ancestor (e.g. scrolled out of a
        // scroll view); the rect is undefined in that case, and a view that is
        // not visible has no meaningful insets.
        return false
      }

      val toRoot = geometry.toRoot
      toRoot.reset()
      var current = view
      while (current !== rootView) {
        val parent = current.parent as? View ?: return false
        toRoot.postConcat(current.matrix)
        toRoot.postTranslate(
            (current.left - parent.scrollX).toFloat(),
            (current.top - parent.scrollY).toFloat(),
        )
        current = parent
      }
      toRoot.getValues(geometry.matrixValues)
      if (
          geometry.matrixValues.any { !it.isFinite() } ||
              abs(geometry.matrixValues[Matrix.MSKEW_X]) * view.height >
                  MAX_AXIS_ALIGNMENT_ERROR_PX ||
              abs(geometry.matrixValues[Matrix.MSKEW_Y]) * view.width >
                  MAX_AXIS_ALIGNMENT_ERROR_PX ||
              geometry.matrixValues[Matrix.MPERSP_0] != 0f ||
              geometry.matrixValues[Matrix.MPERSP_1] != 0f ||
              geometry.matrixValues[Matrix.MPERSP_2] != 1f ||
              geometry.matrixValues[Matrix.MSCALE_X] == 0f ||
              geometry.matrixValues[Matrix.MSCALE_Y] == 0f
      ) {
        return false
      }

      val safeLeft = windowInsets.left.toFloat()
      val safeTop = windowInsets.top.toFloat()
      val safeRight = (rootView.width - windowInsets.right).toFloat()
      val safeBottom = (rootView.height - windowInsets.bottom).toFloat()
      if (safeRight <= safeLeft || safeBottom <= safeTop) {
        return false
      }
      val bounds = geometry.boundsRect
      bounds.set(0f, 0f, view.width.toFloat(), view.height.toFloat())
      // mapRect returns ordered bounding edges, including under reflection.
      toRoot.mapRect(bounds)
      val width = bounds.width()
      val height = bounds.height()
      if (
          !bounds.left.isFinite() ||
              !bounds.top.isFinite() ||
              !bounds.right.isFinite() ||
              !bounds.bottom.isFinite() ||
              !width.isFinite() ||
              !height.isFinite() ||
              width <= 0f ||
              height <= 0f
      ) {
        return false
      }
      out[TOP] = (safeTop - bounds.top).coerceIn(0f, height)
      out[RIGHT] = (bounds.right - safeRight).coerceIn(0f, width)
      out[BOTTOM] = (bounds.bottom - safeBottom).coerceIn(0f, height)
      out[LEFT] = (safeLeft - bounds.left).coerceIn(0f, width)
      return true
    }
  }
}
