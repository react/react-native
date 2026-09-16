/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.drawer

import android.annotation.SuppressLint
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.accessibility.AccessibilityEvent
import androidx.core.view.AccessibilityDelegateCompat
import androidx.core.view.ViewCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import androidx.drawerlayout.widget.DrawerLayout
import com.facebook.common.logging.FLog
import com.facebook.react.R
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.ReactConstants
import com.facebook.react.uimanager.HasChildPressedStateDelay
import com.facebook.react.uimanager.ReactAccessibilityDelegate.AccessibilityRole
import com.facebook.react.uimanager.events.NativeGestureUtil.notifyNativeGestureEnded
import com.facebook.react.uimanager.events.NativeGestureUtil.notifyNativeGestureStarted

/**
 * Wrapper view for [DrawerLayout]. It manages the properties that can be set on the drawer and
 * contains some ReactNative-specific functionality.
 */
public class ReactDrawerLayout(reactContext: ReactContext) :
    DrawerLayout(reactContext), HasChildPressedStateDelay {
  private var drawerPosition = Gravity.START
  private var drawerWidth = DEFAULT_DRAWER_WIDTH
  private var dragging = false

  override var hasChildPressedStateDelay: Boolean? = null

  init {
    ViewCompat.setAccessibilityDelegate(
        this,
        object : AccessibilityDelegateCompat() {
          override fun onInitializeAccessibilityNodeInfo(
              host: View,
              info: AccessibilityNodeInfoCompat,
          ) {
            super.onInitializeAccessibilityNodeInfo(host, info)

            val accessibilityRole = AccessibilityRole.fromViewTag(host)
            if (accessibilityRole != null) {
              info.className = AccessibilityRole.getValue(accessibilityRole)
            }
          }

          override fun onInitializeAccessibilityEvent(host: View, event: AccessibilityEvent) {
            super.onInitializeAccessibilityEvent(host, event)
            val accessibilityRole = host.getTag(R.id.accessibility_role)
            if (accessibilityRole is AccessibilityRole) {
              event.className = AccessibilityRole.getValue(accessibilityRole)
            }
          }
        },
    )
  }

  override fun shouldDelayChildPressedState(): Boolean =
      hasChildPressedStateDelay ?: super.shouldDelayChildPressedState()

  override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
    try {
      if (super.onInterceptTouchEvent(ev)) {
        notifyNativeGestureStarted(this, ev)
        dragging = true
        return true
      }
    } catch (e: IllegalArgumentException) {
      // Log and ignore the error. This seems to be a bug in the android SDK and
      // this is the commonly accepted workaround.
      // https://tinyurl.com/mw6qkod (Stack Overflow)
      FLog.w(ReactConstants.TAG, "Error intercepting touch event.", e)
    }

    return false
  }

  override fun onTouchEvent(ev: MotionEvent): Boolean {
    val action = ev.actionMasked
    if (action == MotionEvent.ACTION_UP && dragging) {
      notifyNativeGestureEnded(this, ev)
      dragging = false
    }
    return super.onTouchEvent(ev)
  }

  @SuppressLint("WrongConstant")
  internal fun openDrawer() {
    openDrawer(drawerPosition)
  }

  @SuppressLint("WrongConstant")
  internal fun closeDrawer() {
    closeDrawer(drawerPosition)
  }

  internal fun setDrawerPosition(newDrawerPosition: Int) {
    drawerPosition = newDrawerPosition
    setDrawerProperties()
  }

  internal fun setDrawerWidth(drawerWidthInPx: Int) {
    drawerWidth = drawerWidthInPx
    setDrawerProperties()
  }

  /*
  Sets the properties of the drawer, after the navigationView has been set.
  */
  internal fun setDrawerProperties() {
    if (this.childCount == 2) {
      val drawerView = this.getChildAt(1)
      val layoutParams = drawerView.layoutParams as LayoutParams
      layoutParams.gravity = drawerPosition
      layoutParams.width = drawerWidth
      drawerView.layoutParams = layoutParams
      drawerView.isClickable = true
    }
  }

  internal companion object {
    internal const val DEFAULT_DRAWER_WIDTH: Int = LayoutParams.MATCH_PARENT
  }
}
