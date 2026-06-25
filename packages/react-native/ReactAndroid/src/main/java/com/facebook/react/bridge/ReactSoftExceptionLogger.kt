/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import androidx.annotation.StringDef
import com.facebook.common.logging.FLog
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.ReactSoftExceptionLogger.Categories.CLIPPING_PROHIBITED_VIEW
import com.facebook.react.bridge.ReactSoftExceptionLogger.Categories.RVG_ADD_CHILDREN_FOR_ACCESSIBILITY
import com.facebook.react.bridge.ReactSoftExceptionLogger.Categories.RVG_IS_VIEW_CLIPPED
import com.facebook.react.bridge.ReactSoftExceptionLogger.Categories.RVG_ON_VIEW_REMOVED
import com.facebook.react.bridge.ReactSoftExceptionLogger.Categories.SOFT_ASSERTIONS
import com.facebook.react.bridge.ReactSoftExceptionLogger.Categories.SURFACE_MOUNTING_MANAGER_MISSING_VIEWSTATE
import java.util.concurrent.CopyOnWriteArrayList

@DoNotStrip
internal object ReactSoftExceptionLogger {
  @Retention(AnnotationRetention.SOURCE)
  @StringDef(
      RVG_ADD_CHILDREN_FOR_ACCESSIBILITY,
      RVG_IS_VIEW_CLIPPED,
      RVG_ON_VIEW_REMOVED,
      CLIPPING_PROHIBITED_VIEW,
      SOFT_ASSERTIONS,
      SURFACE_MOUNTING_MANAGER_MISSING_VIEWSTATE,
  )
  annotation class CategoryMode

  /** Constants that listeners can utilize for custom category-based behavior. */
  object Categories {
    const val RVG_ADD_CHILDREN_FOR_ACCESSIBILITY: String =
        "ReactViewGroup.addChildrenForAccessibility"
    const val RVG_IS_VIEW_CLIPPED: String = "ReactViewGroup.isViewClipped"
    const val RVG_ON_VIEW_REMOVED: String = "ReactViewGroup.onViewRemoved"
    const val CLIPPING_PROHIBITED_VIEW: String = "ReactClippingProhibitedView"
    const val SOFT_ASSERTIONS: String = "SoftAssertions"
    const val SURFACE_MOUNTING_MANAGER_MISSING_VIEWSTATE: String =
        "SurfaceMountingManager:MissingViewState"
  }

  // Use a list instead of a set here because we expect the number of listeners
  // to be very small, and we want listeners to be called in a deterministic
  // order.
  private val listeners: MutableList<ReactSoftExceptionListener> = CopyOnWriteArrayList()

  @JvmStatic
  fun addListener(listener: ReactSoftExceptionListener) {
    if (!listeners.contains(listener)) {
      listeners.add(listener)
    }
  }

  @JvmStatic
  fun removeListener(listener: ReactSoftExceptionListener) {
    listeners.remove(listener)
  }

  @JvmStatic
  fun logSoftExceptionVerbose(@CategoryMode category: String, cause: Throwable) {
    logSoftException("${category}|${cause.javaClass.simpleName}:${cause.message}", cause)
  }

  @JvmStatic
  fun logSoftException(@CategoryMode category: String, cause: Throwable) {
    if (listeners.isNotEmpty()) {
      for (listener in listeners) {
        listener.logSoftException(category, cause)
      }
    } else {
      FLog.e(category, "Unhandled SoftException", cause)
    }
  }

  @JvmStatic
  @DoNotStrip
  private fun logNoThrowSoftExceptionWithMessage(@CategoryMode category: String, message: String) {
    logSoftException(category, ReactNoCrashSoftException(message))
  }

  fun interface ReactSoftExceptionListener {
    fun logSoftException(category: String, cause: Throwable)
  }
}
