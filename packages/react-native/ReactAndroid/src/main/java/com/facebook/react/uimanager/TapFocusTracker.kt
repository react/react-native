/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.graphics.PointF
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.ViewGroup
import android.view.ViewTreeObserver
import com.facebook.react.R
import java.lang.ref.WeakReference

/**
 * Keeps, for the window of a React root, the view a browser would hold focused where Android holds
 * none, since Android's touch mode leaves no view focused unless it is focusable in touch mode: the
 * nearest focusable React view of the last tap on a React root in the window, or of the view whose
 * focus a touch that was no tap took away. A view that takes Android's focus, or held it when
 * tapped, holds that focus itself, so the tap's focus ends.
 *
 * A tap is a touch with one pointer that never moves past the touch slop, so a scroll keeps the
 * focus, as it keeps a browser's.
 */
internal class TapFocusTracker(private val rootViewGroup: ViewGroup) :
    ViewTreeObserver.OnGlobalFocusChangeListener, ViewTreeObserver.OnTouchModeChangeListener {
  private val touchSlop = ViewConfiguration.get(rootViewGroup.context).scaledTouchSlop
  private var tapStart: PointF? = null

  fun handleMotionEvent(motionEvent: MotionEvent) {
    when (motionEvent.actionMasked) {
      MotionEvent.ACTION_DOWN -> tapStart = PointF(motionEvent.x, motionEvent.y)
      MotionEvent.ACTION_MOVE ->
          tapStart = tapStart?.takeIf { start -> isWithinTouchSlop(start, motionEvent) }
      MotionEvent.ACTION_UP -> {
        if (tapStart != null) {
          setFocusedView(findTappedView(motionEvent)?.takeUnless { it.isFocused })
        }
        tapStart = null
      }
      else -> tapStart = null
    }
  }

  /** Follows the focus and the touch mode of the root's window, until [stopObservingWindow]. */
  fun observeWindow() {
    stopObservingWindow()
    rootViewGroup.viewTreeObserver.addOnGlobalFocusChangeListener(this)
    rootViewGroup.viewTreeObserver.addOnTouchModeChangeListener(this)
  }

  fun stopObservingWindow() {
    rootViewGroup.viewTreeObserver.removeOnGlobalFocusChangeListener(this)
    rootViewGroup.viewTreeObserver.removeOnTouchModeChangeListener(this)
  }

  override fun onGlobalFocusChanged(oldFocus: View?, newFocus: View?) {
    if (newFocus != null) {
      setFocusedView(null)
    }
  }

  /**
   * Android calls this before entering touch mode clears the focus of a view not focusable in it.
   */
  override fun onTouchModeChanged(isInTouchMode: Boolean) {
    val focusedView = rootViewGroup.findFocus()
    if (isInTouchMode && focusedView != null && !focusedView.isFocusableInTouchMode) {
      setFocusedView(focusedView.findNearestFocusableReactView())
    }
  }

  private fun isWithinTouchSlop(start: PointF, motionEvent: MotionEvent): Boolean {
    val deltaX = motionEvent.x - start.x
    val deltaY = motionEvent.y - start.y
    return deltaX * deltaX + deltaY * deltaY <= touchSlop * touchSlop
  }

  private fun findTappedView(motionEvent: MotionEvent): View? =
      TouchTargetHelper.findTargetPathAndCoordinatesForTouch(
              motionEvent.x,
              motionEvent.y,
              rootViewGroup,
              FloatArray(2),
          )
          .firstNotNullOfOrNull { target -> target.getView() }
          ?.findNearestFocusableReactView()

  private fun setFocusedView(view: View?) {
    rootViewGroup.rootView.setTag(R.id.tap_focused_view, view?.let(::TappedView))
  }

  private class TappedView(view: View) {
    private val viewReference = WeakReference(view)
    private val viewTag = view.id

    /**
     * The tapped view while it could still hold focus and [rootViewGroup] is the closest React root
     * above it. A view recycled under another tag since the tap stands for another component.
     */
    fun findIn(rootViewGroup: ViewGroup): View? {
      val view = viewReference.get() ?: return null
      if (view.id != viewTag || !view.isShown || !view.isFocusableReactView()) {
        return null
      }
      var parent = view.parent
      while (parent != null && parent !is RootView) {
        parent = parent.parent
      }
      return if (parent === rootViewGroup) view else null
    }
  }

  companion object {
    /** The view the window of [rootViewGroup] holds focused for a browser, if it is inside it. */
    fun findFocusedView(rootViewGroup: ViewGroup): View? =
        (rootViewGroup.rootView.getTag(R.id.tap_focused_view) as? TappedView)?.findIn(rootViewGroup)
  }
}

/** A view without a positive id is no React view, so no JS event can name it. */
private fun View.isFocusableReactView(): Boolean = id > 0 && isFocusable && isEnabled

private fun View.findNearestFocusableReactView(): View? =
    generateSequence(this) { it.parent as? View }.firstOrNull { it.isFocusableReactView() }
