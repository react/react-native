/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.graphics.Rect
import android.view.ViewGroup
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.views.virtual.VirtualViewMode
import java.util.*

internal interface VirtualViewContainer {
  val virtualViewContainerState: VirtualViewContainerState
}

public interface VirtualView {
  public val virtualViewID: String
  public val containerRelativeRect: Rect

  public fun onModeChange(newMode: VirtualViewMode, thresholdRect: Rect): Unit
}

/**
 * Checks whether one Rect overlaps with another Rect.
 *
 * This is different from [Rect.intersects] because a Rect representing a line or a point is
 * considered to overlap with another Rect if the line or point is within the rect bounds. However,
 * two Rects are not considered to overlap if they only share a boundary.
 */
internal fun rectsOverlap(rect1: Rect, rect2: Rect): Boolean {
  if (rect1.top >= rect2.bottom || rect2.top >= rect1.bottom) {
    // No overlap on the y-axis.
    return false
  }
  if (rect1.left >= rect2.right || rect2.left >= rect1.right) {
    // No overlap on the x-axis.
    return false
  }
  return true
}

/**
 * Manages the state and visibility tracking of virtual views within a scroll container.
 *
 * Virtual views are lightweight representations of off-screen content that can transition between
 * rendering modes (e.g., visible, prerendered, hidden) based on their position relative to the
 * scroll viewport. Subclasses implement the specific strategy for tracking and updating these
 * views.
 *
 * Use [create] to obtain an instance appropriate for the current feature flag configuration.
 */
public abstract class VirtualViewContainerState {
  protected val prerenderRatio: Double = ReactNativeFeatureFlags.virtualViewPrerenderRatio()
  protected abstract val virtualViews: MutableCollection<VirtualView>
  protected val emptyRect: Rect = Rect()
  protected val visibleRect: Rect = Rect()
  protected val prerenderRect: Rect = Rect()
  protected val scrollView: ViewGroup

  public companion object {
    @JvmStatic
    public fun create(scrollView: ViewGroup): VirtualViewContainerState {
      return if (ReactNativeFeatureFlags.enableVirtualViewContainerStateExperimental()) {
        VirtualViewContainerStateExperimental(scrollView)
      } else {
        VirtualViewContainerStateClassic(scrollView)
      }
    }
  }

  public constructor(scrollView: ViewGroup) {
    this.scrollView = scrollView
  }

  public open fun onChange(virtualView: VirtualView) {
    virtualViews.add(virtualView)
    updateModes(virtualView)
  }

  public open fun remove(virtualView: VirtualView) {
    assert(virtualViews.remove(virtualView)) {
      "Attempting to remove non-existent VirtualView: ${virtualView.virtualViewID}"
    }
  }

  // Called on ScrollView onLayout or onScroll
  public fun updateState() {
    updateModes()
  }

  /** Refreshes the coordinates for the Rects this class cares about (visibleRect, prerenderRect) */
  protected fun updateRects() {
    scrollView.getDrawingRect(visibleRect)

    // This happens because ScrollView content isn't ready yet. The danger here is if ScrollView
    // intentionally goes but curently ScrollView and v1 Fling use this check to determine if
    // "content ready"
    if (visibleRect.isEmpty()) {
      // should set the other rects here in case scrollview is suddenly empty after the other rects
      // are non-empty
      prerenderRect.set(visibleRect)
      return
    }

    prerenderRect.set(visibleRect)
    prerenderRect.inset(
        (-prerenderRect.width() * prerenderRatio).toInt(),
        (-prerenderRect.height() * prerenderRatio).toInt(),
    )
  }

  protected abstract fun updateModes(virtualView: VirtualView? = null)
}
