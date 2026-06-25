/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.runtime

import android.content.Context
import android.graphics.Point
import android.graphics.Rect
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.common.logging.FLog
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.uimanager.IllegalViewOperationException
import com.facebook.react.uimanager.JSKeyDispatcher
import com.facebook.react.uimanager.JSPointerDispatcher
import com.facebook.react.uimanager.JSTouchDispatcher
import com.facebook.react.views.view.isEdgeToEdgeFeatureFlagOn
import com.facebook.systrace.Systrace
import java.util.Objects
import kotlin.math.max

/**
 * A view created by [com.facebook.react.interfaces.fabric.ReactSurface] that's responsible for
 * rendering a React component.
 */
@OptIn(FrameworkAPI::class, UnstableReactNativeAPI::class)
public class ReactSurfaceView(context: Context?, internal val surface: ReactSurfaceImpl) :
    ReactRootView(context) {
  private val jsTouchDispatcher: JSTouchDispatcher = JSTouchDispatcher(this)
  private var jsPointerDispatcher: JSPointerDispatcher? = null
  private var jsKeyDispatcher: JSKeyDispatcher? = null
  private var wasMeasured = false
  private var widthMeasureSpec = 0
  private var heightMeasureSpec = 0

  private val viewportOffset: Point
    get() {
      val locationInWindow = IntArray(2)
      getLocationInWindow(locationInWindow)

      if (!isEdgeToEdgeFeatureFlagOn) {
        // When not in edge-to-edge mode, subtract the top system bar insets so the offset is
        // relative to the content area (below the status bar / cutout).
        ViewCompat.getRootWindowInsets(this)?.apply {
          val insets =
              getInsets(
                  WindowInsetsCompat.Type.statusBars() or WindowInsetsCompat.Type.displayCutout()
              )

          locationInWindow[0] -= insets.left
          locationInWindow[1] -= insets.top
        }
      }

      return Point(locationInWindow[0], locationInWindow[1])
    }

  init {
    if (ReactFeatureFlags.dispatchPointerEvents) {
      jsPointerDispatcher = JSPointerDispatcher(this)
    }
    if (ReactNativeFeatureFlags.enableKeyEvents()) {
      jsKeyDispatcher = JSKeyDispatcher()
    }
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    Systrace.beginSection(Systrace.TRACE_TAG_REACT, "ReactSurfaceView.onMeasure")
    var width = 0
    var height = 0
    val widthMode = MeasureSpec.getMode(widthMeasureSpec)
    if (widthMode == MeasureSpec.AT_MOST || widthMode == MeasureSpec.UNSPECIFIED) {
      for (i in 0 until childCount) {
        val child = getChildAt(i)
        val childSize = (child.left + child.measuredWidth + child.paddingLeft + child.paddingRight)
        width = max(width, childSize)
      }
    } else {
      width = MeasureSpec.getSize(widthMeasureSpec)
    }
    val heightMode = MeasureSpec.getMode(heightMeasureSpec)
    if (heightMode == MeasureSpec.AT_MOST || heightMode == MeasureSpec.UNSPECIFIED) {
      for (i in 0 until childCount) {
        val child = getChildAt(i)
        val childSize = (child.top + child.measuredHeight + child.paddingTop + child.paddingBottom)
        height = max(height, childSize)
      }
    } else {
      height = MeasureSpec.getSize(heightMeasureSpec)
    }
    setMeasuredDimension(width, height)
    wasMeasured = true
    this.widthMeasureSpec = widthMeasureSpec
    this.heightMeasureSpec = heightMeasureSpec
    val viewportOffset = viewportOffset
    surface.updateLayoutSpecs(
        widthMeasureSpec,
        heightMeasureSpec,
        viewportOffset.x,
        viewportOffset.y,
    )
    Systrace.endSection(Systrace.TRACE_TAG_REACT)
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    // Call updateLayoutSpecs to update locationOnScreen offsets, in case they've changed
    if (wasMeasured && changed) {
      val viewportOffset = viewportOffset
      surface.updateLayoutSpecs(
          widthMeasureSpec,
          heightMeasureSpec,
          viewportOffset.x,
          viewportOffset.y,
      )
    }
  }

  override fun requestDisallowInterceptTouchEvent(disallowIntercept: Boolean) {
    // Override in order to still receive events to onInterceptTouchEvent even when some other
    // views disallow that, but propagate it up the tree if possible.
    parent?.requestDisallowInterceptTouchEvent(disallowIntercept)
  }

  /**
   * Called when a child starts a native gesture (e.g. a scroll in a ScrollView). Should be called
   * from the child's onTouchIntercepted implementation.
   */
  override fun onChildStartedNativeGesture(childView: View?, ev: MotionEvent) {
    val eventDispatcher = surface.eventDispatcher ?: return
    jsTouchDispatcher.onChildStartedNativeGesture(
        ev,
        eventDispatcher,
        surface.reactHost?.currentReactContext,
    )
    childView?.let { jsPointerDispatcher?.onChildStartedNativeGesture(it, ev, eventDispatcher) }
  }

  override fun onChildEndedNativeGesture(childView: View, ev: MotionEvent) {
    val eventDispatcher = surface.eventDispatcher ?: return
    jsTouchDispatcher.onChildEndedNativeGesture(ev, eventDispatcher)
    jsPointerDispatcher?.onChildEndedNativeGesture()
  }

  override fun handleException(t: Throwable) {
    val e = IllegalViewOperationException(Objects.toString(t.message, ""), this, t)
    (surface.reactHost ?: throw e).handleHostException(e)
  }

  override fun getJSModuleName(): String = surface.moduleName

  override fun dispatchJSTouchEvent(event: MotionEvent) {
    val eventDispatcher = surface.eventDispatcher
    if (eventDispatcher != null) {
      jsTouchDispatcher.handleTouchEvent(
          event,
          eventDispatcher,
          surface.reactHost?.currentReactContext,
      )
    } else {
      FLog.w(
          TAG,
          "Unable to dispatch touch events to JS as the React instance has not been attached",
      )
    }
  }

  override fun dispatchJSPointerEvent(event: MotionEvent, isCapture: Boolean) {
    if (jsPointerDispatcher == null) {
      if (!ReactFeatureFlags.dispatchPointerEvents) {
        return
      }
      FLog.w(TAG, "Unable to dispatch pointer events to JS before the dispatcher is available")
      return
    }
    val eventDispatcher = surface.eventDispatcher
    if (eventDispatcher != null) {
      jsPointerDispatcher?.handleMotionEvent(event, eventDispatcher, isCapture)
    } else {
      FLog.w(
          TAG,
          "Unable to dispatch pointer events to JS as the React instance has not been attached",
      )
    }
  }

  override fun dispatchJSKeyEvent(event: KeyEvent) {
    if (jsKeyDispatcher == null) {
      if (!ReactNativeFeatureFlags.enableKeyEvents()) {
        return
      }
      FLog.w(TAG, "Unable to dispatch key events to JS before the dispatcher is available")
      return
    }
    val eventDispatcher = surface.eventDispatcher
    if (eventDispatcher != null) {
      jsKeyDispatcher?.handleKeyEvent(event, eventDispatcher, surface.surfaceID)
    } else {
      FLog.w(
          TAG,
          "Unable to dispatch key events to JS as the React instance has not been attached",
      )
    }
  }

  override fun requestChildFocus(child: View?, focused: View?) {
    super.requestChildFocus(child, focused)

    if (ReactNativeFeatureFlags.enableKeyEvents()) {
      val focusedViewTag = focused?.id
      if (focusedViewTag != null) {
        jsKeyDispatcher?.setFocusedView(focusedViewTag)
      }
    }
  }

  override fun onFocusChanged(gainFocus: Boolean, direction: Int, previouslyFocusedRect: Rect?) {
    super.onFocusChanged(gainFocus, direction, previouslyFocusedRect)

    if (ReactNativeFeatureFlags.enableKeyEvents()) {
      if (gainFocus) {
        val focusedViewTag = focusedChild?.id
        if (focusedViewTag != null) {
          jsKeyDispatcher?.setFocusedView(focusedViewTag)
        }
      } else {
        jsKeyDispatcher?.clearFocus()
      }
    }
  }

  override fun hasActiveReactContext(): Boolean =
      surface.isAttached && surface.reactHost?.currentReactContext != null

  override fun hasActiveReactInstance(): Boolean =
      surface.isAttached && surface.reactHost?.isInstanceInitialized == true

  override fun getCurrentReactContext(): ReactContext? =
      if (surface.isAttached) {
        surface.reactHost?.currentReactContext
      } else null

  override fun isViewAttachedToReactInstance(): Boolean = surface.isAttached

  private companion object {
    private const val TAG = "ReactSurfaceView"
  }
}
