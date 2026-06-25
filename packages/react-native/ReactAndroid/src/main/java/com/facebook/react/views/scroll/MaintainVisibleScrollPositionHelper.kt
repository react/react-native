/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.graphics.Rect
import android.view.View
import android.view.ViewGroup
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UIManager
import com.facebook.react.bridge.UIManagerListener
import com.facebook.react.bridge.UiThreadUtil.runOnUiThread
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.react.views.scroll.ReactScrollViewHelper.HasSmoothScroll
import com.facebook.react.views.view.ReactViewGroup
import java.lang.ref.WeakReference

/**
 * Manage state for the maintainVisibleContentPosition prop.
 *
 * This uses UIManager to listen to updates and capture position of items before and after layout.
 */
@OptIn(UnstableReactNativeAPI::class)
internal class MaintainVisibleScrollPositionHelper<ScrollViewT>(
    private val scrollView: ScrollViewT,
    private val horizontal: Boolean,
) : UIManagerListener where ScrollViewT : HasSmoothScroll?, ScrollViewT : ViewGroup? {

  var config: Config? = null
  private var firstVisibleViewRef: WeakReference<View>? = null
  private var prevFirstVisibleFrame: Rect? = null
  private var isListening = false

  private val contentView: ReactViewGroup?
    get() = scrollView?.getChildAt(0) as ReactViewGroup?

  private val uIManager: UIManager
    get() =
        checkNotNull(
            UIManagerHelper.getUIManager(
                checkNotNull(scrollView?.context as ReactContext?),
                UIManagerType.FABRIC,
            )
        )

  class Config
  internal constructor(val minIndexForVisible: Int, val autoScrollToTopThreshold: Int?) {
    companion object {
      @JvmStatic
      fun fromReadableMap(value: ReadableMap): Config {
        val minIndexForVisible = value.getInt("minIndexForVisible")
        val autoScrollToTopThreshold =
            if (value.hasKey("autoscrollToTopThreshold")) value.getInt("autoscrollToTopThreshold")
            else null
        return Config(minIndexForVisible, autoScrollToTopThreshold)
      }
    }
  }

  /** Start listening to view hierarchy updates. Should be called when this is created. */
  fun start() {
    if (isListening) {
      return
    }
    isListening = true
    uIManager.addUIManagerEventListener(this)
  }

  /** Stop listening to view hierarchy updates. Should be called before this is destroyed. */
  fun stop() {
    if (!isListening) {
      return
    }
    isListening = false
    uIManager.removeUIManagerEventListener(this)
  }

  private fun updateScrollPositionInternal() {
    val config = config ?: return
    val firstVisibleViewRef = firstVisibleViewRef ?: return
    val prevFirstVisibleFrame = prevFirstVisibleFrame ?: return
    val firstVisibleView = firstVisibleViewRef.get() ?: return
    val scrollView = scrollView ?: return

    val newFrame = Rect()
    firstVisibleView.getHitRect(newFrame)

    if (horizontal) {
      val deltaX = newFrame.left - prevFirstVisibleFrame.left
      if (deltaX != 0) {
        val scrollX = scrollView.scrollX
        scrollView.scrollToPreservingMomentum(scrollX + deltaX, scrollView.scrollY)
        this.prevFirstVisibleFrame = newFrame
        if (config.autoScrollToTopThreshold != null && scrollX <= config.autoScrollToTopThreshold) {
          scrollView.reactSmoothScrollTo(0, scrollView.scrollY)
        }
      }
    } else {
      val deltaY = newFrame.top - prevFirstVisibleFrame.top
      if (deltaY != 0) {
        val scrollY = scrollView.scrollY
        scrollView.scrollToPreservingMomentum(scrollView.scrollX, scrollY + deltaY)
        this.prevFirstVisibleFrame = newFrame
        if (config.autoScrollToTopThreshold != null && scrollY <= config.autoScrollToTopThreshold) {
          scrollView.reactSmoothScrollTo(scrollView.scrollX, 0)
        }
      }
    }
  }

  private fun computeTargetView() {
    val config = config ?: return
    val scrollView = scrollView ?: return
    val contentView = contentView ?: return

    val currentScroll = if (horizontal) scrollView.scrollX else scrollView.scrollY
    for (i in config.minIndexForVisible until contentView.childCount) {
      val child = contentView.getChildAt(i)

      // Compute the position of the end of the child
      val position = if (horizontal) child.x + child.width else child.y + child.height

      // If the child is partially visible or this is the last child, select it as the anchor.
      if (position > currentScroll || i == contentView.childCount - 1) {
        firstVisibleViewRef = WeakReference(child)
        val frame = Rect()
        child.getHitRect(frame)
        prevFirstVisibleFrame = frame
        break
      }
    }
  }

  // UIManagerListener
  override fun willDispatchViewUpdates(uiManager: UIManager) {
    runOnUiThread { computeTargetView() }
  }

  override fun willMountItems(uiManager: UIManager) {
    computeTargetView()
  }

  override fun didMountItems(uiManager: UIManager) {
    updateScrollPositionInternal()
  }

  override fun didDispatchMountItems(uiManager: UIManager) {
    // noop
  }

  override fun didScheduleMountItems(uiManager: UIManager) {
    // noop
  }
}
