/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.view.ViewGroup
import com.facebook.common.logging.FLog
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.views.virtual.VirtualViewMode

internal class VirtualViewContainerStateClassic(scrollView: ViewGroup) :
    VirtualViewContainerState(scrollView) {

  // Provide the concrete implementation for the abstract virtualViews property
  override val virtualViews: MutableCollection<VirtualView> = mutableSetOf()

  // Implement the abstract updateModes method
  override fun updateModes(virtualView: VirtualView?) {
    scrollView.getDrawingRect(visibleRect)

    if (visibleRect.isEmpty()) {
      debugLog("updateModes", { "scrollView visibleRect is empty" })
      return
    }

    prerenderRect.set(visibleRect)
    prerenderRect.inset(
        (-prerenderRect.width() * prerenderRatio).toInt(),
        (-prerenderRect.height() * prerenderRatio).toInt(),
    )

    val virtualViewsIt =
        if (virtualView != null) listOf(virtualView) else virtualViews.toMutableSet()
    virtualViewsIt.forEach { vv ->
      val rect = vv.containerRelativeRect

      var mode: VirtualViewMode = VirtualViewMode.Hidden
      var thresholdRect = emptyRect
      when {
        rectsOverlap(rect, visibleRect) -> {
          thresholdRect = visibleRect
          mode = VirtualViewMode.Visible
        }
        rectsOverlap(rect, prerenderRect) -> {
          mode = VirtualViewMode.Prerender
          thresholdRect = prerenderRect
        }
      }

      vv.onModeChange(mode, thresholdRect)
      debugLog(
          "updateModes",
          { "virtualView=${vv.virtualViewID} mode=$mode  rect=$rect thresholdRect=$thresholdRect" },
      )
    }
  }

  internal companion object {
    private val ENABLE_DEBUG_LOGS = ReactBuildConfig.DEBUG && false

    internal inline fun debugLog(subtag: String, block: () -> String = { "" }) {
      if (ENABLE_DEBUG_LOGS) {
        FLog.d("VirtualViewContainerStateClassic:$subtag", block())
      }
    }
  }
}
