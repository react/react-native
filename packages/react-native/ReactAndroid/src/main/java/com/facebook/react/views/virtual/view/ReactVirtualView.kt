/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.virtual.view

import android.content.Context
import android.graphics.Rect
import android.view.View
import android.view.ViewParent
import androidx.annotation.VisibleForTesting
import com.facebook.common.logging.FLog
import com.facebook.react.R
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.uimanager.ReactClippingViewGroup
import com.facebook.react.uimanager.ReactRoot
import com.facebook.react.views.scroll.VirtualView
import com.facebook.react.views.scroll.VirtualViewContainer
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.virtual.VirtualViewMode
import com.facebook.react.views.virtual.VirtualViewModeChangeEmitter
import com.facebook.react.views.virtual.VirtualViewRenderState

public class ReactVirtualView(context: Context) :
    ReactViewGroup(context), VirtualView, View.OnLayoutChangeListener {

  internal var mode: VirtualViewMode? = null
  internal var modeChangeEmitter: VirtualViewModeChangeEmitter? = null
  internal var renderState: VirtualViewRenderState = VirtualViewRenderState.Unknown

  private var scrollView: VirtualViewContainer? = null

  private val lastContainerRelativeRect: Rect = Rect()
  private val lastClippingRect: Rect = Rect()
  override val containerRelativeRect: Rect = Rect()
  private var offsetX: Int = 0
  private var offsetY: Int = 0
  private var hadLayout: Boolean = false

  internal val nativeId: String?
    get() = getTag(R.id.view_tag_native_id) as? String

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    doAttachedToWindow()
  }

  @VisibleForTesting
  internal fun doAttachedToWindow() {
    scrollView = getScrollView()
    // onAttachedToWindow is usually called before layout but there are cases where it's called
    // after. If called after, we need to report the updated layout to the VirtualViewContainer
    if (hadLayout) {
      updateParentOffset()
      reportRectChangeToContainer()
    }
    debugLog("doAttachedToWindow")
  }

  /** From [View#onLayout] */
  // This is when the view itself has layout changes
  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    hadLayout = true
    if (changed) {
      containerRelativeRect.set(
          left + offsetX,
          top + offsetY,
          right + offsetX,
          bottom + offsetY,
      )
      debugLog("onLayout") { "containerRelativeRect=$containerRelativeRect" }
      reportRectChangeToContainer()
    }
  }

  // Here we're subscribing to all parent views up to scrollView and when their layout changes
  override fun onLayoutChange(
      v: View?,
      left: Int,
      top: Int,
      right: Int,
      bottom: Int,
      oldLeft: Int,
      oldTop: Int,
      oldRight: Int,
      oldBottom: Int,
  ) {
    if (oldLeft != left || oldTop != top) {
      updateParentOffset()
      debugLog("onLayoutChange") { "containerRelativeRect=$containerRelativeRect" }
      reportRectChangeToContainer()
    }
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    containerRelativeRect.set(
        left + offsetX,
        top + offsetY,
        right + offsetX,
        bottom + offsetY,
    )
    debugLog("onSizeChanged") { "container=$containerRelativeRect" }
    reportRectChangeToContainer()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    recycleView()
  }

  override internal fun recycleView() {
    cleanupLayoutListeners()
    scrollView?.virtualViewContainerState?.remove(this)
    scrollView = null
    mode = null
    modeChangeEmitter = null
    hadLayout = false
    lastContainerRelativeRect.setEmpty()
    lastClippingRect.setEmpty()
    containerRelativeRect.setEmpty()
  }

  override val virtualViewID: String
    get() {
      return "${nativeId ?: "unknown"}:::${id}"
    }

  override fun onModeChange(newMode: VirtualViewMode, thresholdRect: Rect) {
    modeChangeEmitter ?: return
    scrollView ?: return

    if (newMode == VirtualViewMode.Visible) {
      updateClippingRect(null)
    }

    if (newMode == mode) {
      debugLog("onModeChange") { "no change $newMode" }
      return
    }

    val oldMode = mode
    mode = newMode

    debugLog("onModeChange") { "$oldMode->$newMode" }

    if (oldMode == VirtualViewMode.Visible) {
      updateClippingRect(null)
    }

    when (newMode) {
      VirtualViewMode.Visible -> {
        // If the previous mode was hidden, emit a mode change even if `renderState` is rendered,
        // because the hidden mode change is still pending and will eventually be committed. Only
        // skip emitting a mode change if the previous mode was prerender and the result of that
        // event has already been committed.
        if (
            oldMode == null ||
                oldMode == VirtualViewMode.Hidden ||
                renderState != VirtualViewRenderState.Rendered
        ) {
          modeChangeEmitter?.emitModeChange(
              VirtualViewMode.Visible,
              containerRelativeRect,
              thresholdRect,
              synchronous = true,
          )
        }
      }
      VirtualViewMode.Prerender -> {
        if (oldMode != VirtualViewMode.Visible) {
          modeChangeEmitter?.emitModeChange(
              VirtualViewMode.Prerender,
              containerRelativeRect,
              thresholdRect,
              synchronous = false,
          )
        }
      }
      VirtualViewMode.Hidden -> {
        modeChangeEmitter?.emitModeChange(
            VirtualViewMode.Hidden,
            containerRelativeRect,
            thresholdRect,
            synchronous = false,
        )
      }
    }
  }

  // Note: We co-opt subview clipping on ReactVirtualView by returning the
  // clipping rect of the ScrollView. This means we clip the children of ReactVirtualView
  // when they are out of the viewport, but not ReactVirtualView itself.
  override fun updateClippingRect(excludedViews: Set<Int>?) {
    if (!_removeClippedSubviews) {
      return
    }

    // If no ScrollView, or ScrollView has disabled removeClippedSubviews, use default behavior
    if (scrollView == null) {
      super.updateClippingRect(excludedViews)
      return
    }

    val clippingRect = checkNotNull(clippingRect)
    val scrollView = checkNotNull(scrollView) as ReactClippingViewGroup

    if (scrollView.removeClippedSubviews) {
      scrollView.getClippingRect(clippingRect)
    } else {
      (scrollView as View).getDrawingRect(clippingRect)
    }

    clippingRect.intersect(containerRelativeRect)
    clippingRect.offset(-containerRelativeRect.left, -containerRelativeRect.top)

    if (lastClippingRect == clippingRect) {
      return
    }

    updateClippingToRect(clippingRect, excludedViews)
    lastClippingRect.set(clippingRect)
  }

  private fun updateParentOffset() {
    val virtualViewScrollView = scrollView ?: return
    offsetX = 0
    offsetY = 0
    var parent: ViewParent? = parent
    while (parent != null && parent != virtualViewScrollView) {
      if (parent is View) {
        offsetX += parent.left
        offsetY += parent.top
      }
      parent = parent.parent
    }
    containerRelativeRect.set(
        left + offsetX,
        top + offsetY,
        right + offsetX,
        bottom + offsetY,
    )
  }

  private fun reportRectChangeToContainer() {
    if (lastContainerRelativeRect == containerRelativeRect) {
      debugLog("reportRectChangeToContainer") { "no rect change $containerRelativeRect" }
      return
    }

    if (scrollView != null) {
      scrollView?.virtualViewContainerState?.onChange(this)
      lastContainerRelativeRect.set(containerRelativeRect)
    }
  }

  private fun getScrollView(): VirtualViewContainer? = traverseParentStack(true)

  private fun cleanupLayoutListeners() {
    traverseParentStack(false)
  }

  private fun traverseParentStack(addListeners: Boolean): VirtualViewContainer? {
    var parent: ViewParent? = parent
    while (parent != null) {
      if (parent is VirtualViewContainer) {
        return parent
      }
      if (parent is ReactRoot) {
        // don't look past the root - it could traverse into a separate hierarchy
        return null
      }
      if (parent is View) {
        // always remove, to ensure listeners aren't added more than once
        parent.removeOnLayoutChangeListener(this)
        if (addListeners) {
          parent.addOnLayoutChangeListener(this)
        }
      }
      parent = parent.parent
    }
    return null
  }

  private companion object {
    private val ENABLE_DEBUG_LOGS: Boolean = ReactBuildConfig.DEBUG && false
  }

  private inline fun debugLog(subtag: String, block: () -> String = { "" }) {
    if (ENABLE_DEBUG_LOGS) {
      FLog.d("ReactVirtualView:[$virtualViewID]:$subtag", block())
    }
  }
}
